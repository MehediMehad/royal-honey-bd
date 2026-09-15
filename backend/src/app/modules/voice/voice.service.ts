import axios from 'axios';
import { toFile } from 'openai';
import openai from '../../libs/openai';
import config from '../../../configs';
import type { IAudioProcessPayload, ITranscriptionResult } from './voice.interface';

// Domain-specific vocabulary prompt to guide Whisper for Royal Honey BD products and terminology
const BANGLA_WHISPER_PROMPT =
  'Royal Honey BD, কালোজিরা ফুলের মধু, সরিষা ফুলের মধু, সুন্দরবনের মধু, স্পেশাল মিনি হানি কম্ব, বিশুদ্ধ ঘি, Honey Nut, ক্যাশ অন ডেলিভারি, বিকাশ, নগদ, TrxID, ডেলিভারি চার্জ, ঢাকা, আদাবর, মিরপুর, উত্তরা, বনশ্রী, ধানমন্ডি, চট্টগ্রাম, সিলেট, রাজশাহী, খুলনা, বরিশাল, রংপুর, ময়মনসিংহ।';

// Inaudible / silence hallucination patterns sometimes emitted by Whisper on blank audio
const SILENCE_PATTERNS = [
  'thank you',
  'subtitles by',
  'amara.org',
  'watching',
  'you for watching',
  '...',
  'প্রতিবেদন:',
];

/**
 * Download audio binary from URL (supports Meta CDN, WhatsApp Cloud API, direct web links)
 */
const downloadAudioBuffer = async (
  audioUrl: string,
  channel?: 'FACEBOOK' | 'WHATSAPP',
): Promise<{ buffer: Buffer; mimeType: string }> => {
  let downloadUrl = audioUrl;
  let targetMimeType = 'audio/ogg';
  const token =
    channel === 'WHATSAPP'
      ? config.meta.whatsappToken
      : config.meta.pageAccessToken;

  // Step 1: If WhatsApp media endpoint (graph.facebook.com), retrieve the actual CDN URL first
  if (downloadUrl.includes('graph.facebook.com')) {
    console.log(`📥 [VoiceService] Resolving Meta Graph API media URL: ${downloadUrl}`);
    const metaResponse = await axios.get(downloadUrl, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      timeout: 15000,
    });

    if (metaResponse.data?.url) {
      downloadUrl = metaResponse.data.url;
      if (metaResponse.data.mime_type) {
        targetMimeType = metaResponse.data.mime_type;
      }
      console.log(`📥 [VoiceService] Resolved actual media download URL: ${downloadUrl.substring(0, 80)}...`);
    }
  }

  // Step 2: Download binary audio stream from CDN
  const headers: Record<string, string> = {
    'User-Agent': 'RoyalHoneyBD-Worker/1.0',
  };
  if (token && (downloadUrl.includes('facebook.com') || downloadUrl.includes('fbsbx.com'))) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await axios.get(downloadUrl, {
    responseType: 'arraybuffer',
    headers,
    timeout: 30000,
  });

  const contentType = String(response.headers['content-type'] || targetMimeType);
  const buffer = Buffer.from(response.data);

  console.log(`✅ [VoiceService] Downloaded audio buffer: ${buffer.length} bytes, type: ${contentType}`);
  return { buffer, mimeType: contentType };
};

/**
 * Validate whether transcription is audible and intelligible Bangla speech
 */
const isTranscriptionAmbiguous = (text: string): boolean => {
  const clean = text.trim();
  if (!clean || clean.length < 2) return true;

  // Check if it only contains non-letter characters
  const hasLetters = /[\p{L}]/u.test(clean);
  if (!hasLetters) return true;

  // Check against known Whisper silence artifacts if very short
  if (clean.length < 25) {
    const lower = clean.toLowerCase();
    for (const pattern of SILENCE_PATTERNS) {
      if (lower.includes(pattern)) return true;
    }
  }

  return false;
};

/**
 * Transcribe customer Bangla voice message using OpenAI Whisper API
 */
const transcribeBanglaAudio = async (
  payload: IAudioProcessPayload,
): Promise<ITranscriptionResult> => {
  let audioBuffer: Buffer;
  let mimeType = payload.mimeType || 'audio/ogg';

  if (payload.audioBuffer) {
    audioBuffer = payload.audioBuffer;
  } else if (payload.audioUrl) {
    const downloaded = await downloadAudioBuffer(payload.audioUrl, payload.channel);
    audioBuffer = downloaded.buffer;
    mimeType = downloaded.mimeType;
  } else {
    throw new Error('Either audioUrl or audioBuffer must be provided');
  }

  // Determine file extension for OpenAI Whisper
  let extension = 'ogg';
  const cleanMime = mimeType.split(';')[0].trim().toLowerCase();
  if (cleanMime.includes('mp4') || cleanMime.includes('m4a')) extension = 'm4a';
  else if (cleanMime.includes('mp3') || cleanMime.includes('mpeg')) extension = 'mp3';
  else if (cleanMime.includes('wav')) extension = 'wav';
  else if (cleanMime.includes('webm')) extension = 'webm';
  else if (cleanMime.includes('aac')) extension = 'aac';
  else if (cleanMime.includes('ogg') || cleanMime.includes('opus')) extension = 'ogg';

  try {
    const file = await toFile(audioBuffer, `voice_input.${extension}`, {
      type: cleanMime,
    });

    const transcription = await openai.audio.transcriptions.create({
      file,
      model: 'whisper-1',
      prompt: BANGLA_WHISPER_PROMPT,
      temperature: 0.2, // Low temperature for high factual precision
    });

    const transcribedText = (transcription.text || '').trim();
    const ambiguous = isTranscriptionAmbiguous(transcribedText);

    console.log(`🎙️ [VoiceService] Transcribed text: "${transcribedText}" (ambiguous: ${ambiguous})`);

    return {
      text: transcribedText,
      language: 'bn',
      isAmbiguous: ambiguous,
      provider: 'whisper',
      raw: transcription,
    };
  } catch (error: any) {
    console.error('❌ [VoiceService] Whisper transcription error:', error?.message || error);

    // If API key is missing or quota reached in development, provide fallback message
    if (!config.openai.apiKey || config.openai.apiKey === 'dummy_api_key_for_offline_dev') {
      console.warn('⚠️ [VoiceService] OPENAI_API_KEY is dummy/missing. Using mock voice fallback.');
      return {
        text: 'আমার নাম রহিম, আদাবরে থাকি, দুইটা কালোজিরা ফুলের মধু লাগবে ক্যাশ অন ডেলিভারিতে।',
        language: 'bn',
        isAmbiguous: false,
        provider: 'mock',
      };
    }

    throw new Error(`Voice transcription failed: ${error?.message || error}`);
  }
};

export const VoiceServices = {
  downloadAudioBuffer,
  transcribeBanglaAudio,
  isTranscriptionAmbiguous,
};
