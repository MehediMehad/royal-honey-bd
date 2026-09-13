import axios from 'axios';
import { toFile } from 'openai';
import openai from '../../libs/openai';
import config from '../../../configs';
import { VisionServices } from '../vision/vision.service';
import type { IAnalyzeVideoPayload, IVideoAnalysisResult } from './video.interface';

const BANGLA_VIDEO_WHISPER_PROMPT =
  'Royal Honey BD, কালোজিরা মধু, সরিষা মধু, সুন্দরবন মধু, খাঁটি মধু, ভাঙা বয়াম, পার্সেল ক্ষতিগ্রস্ত, আনবক্সিং, ক্যাশ অন ডেলিভারি, বিকাশ, ডেলিভারি চার্জ।';

/**
 * Download video binary stream
 */
const downloadVideoBuffer = async (
  videoUrl: string,
  channel?: 'FACEBOOK' | 'WHATSAPP',
): Promise<{ buffer: Buffer; mimeType: string }> => {
  const headers: Record<string, string> = {};

  if (videoUrl.includes('graph.facebook.com') || videoUrl.includes('lookaside.fbsbx.com')) {
    const token =
      channel === 'WHATSAPP'
        ? config.meta.whatsappToken
        : config.meta.pageAccessToken;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await axios.get(videoUrl, {
    responseType: 'arraybuffer',
    headers,
    timeout: 30000,
    maxContentLength: 25 * 1024 * 1024, // 25 MB limit for API safety
  });

  const contentType = String(response.headers['content-type'] || 'video/mp4');
  const buffer = Buffer.from(response.data);

  return { buffer, mimeType: contentType };
};

/**
 * Transcribe spoken speech from video container (.mp4 / .webm / .mpeg) via OpenAI Whisper
 */
const transcribeVideoAudio = async (
  videoBuffer: Buffer,
  mimeType = 'video/mp4',
): Promise<string> => {
  let extension = 'mp4';
  if (mimeType.includes('webm')) extension = 'webm';
  else if (mimeType.includes('mpeg')) extension = 'mpeg';
  else if (mimeType.includes('m4a')) extension = 'm4a';

  if (!config.openai.apiKey || config.openai.apiKey === 'dummy_api_key_for_offline_dev') {
    return 'ভাই আমার সুন্দরবনের মধুর পার্সেলটা ভাঙা পেয়েছি, বয়ামটা ভেঙে মধু পড়ে গেছে।';
  }

  try {
    const file = await toFile(videoBuffer, `customer_video.${extension}`, {
      type: mimeType,
    });

    const transcription = await openai.audio.transcriptions.create({
      file,
      model: 'whisper-1',
      language: 'bn',
      prompt: BANGLA_VIDEO_WHISPER_PROMPT,
      temperature: 0.2,
    });

    return (transcription.text || '').trim();
  } catch (error: any) {
    console.warn('⚠️ [VideoService] Video audio track transcription note:', error?.message || error);
    // Many videos may be silent (e.g. customer just recording a broken jar without speaking)
    return '';
  }
};

/**
 * Analyze customer video: extracts audio track + inspects visual context
 */
const analyzeCustomerVideo = async (
  payload: IAnalyzeVideoPayload,
): Promise<IVideoAnalysisResult> => {
  let videoBuffer: Buffer | undefined = payload.videoBuffer;
  let mimeType = payload.mimeType || 'video/mp4';

  if (!videoBuffer && payload.videoUrl) {
    try {
      const downloaded = await downloadVideoBuffer(payload.videoUrl, payload.channel);
      videoBuffer = downloaded.buffer;
      mimeType = downloaded.mimeType;
    } catch (err: any) {
      console.warn(`⚠️ [VideoService] Video download failed: ${err?.message}`);
    }
  }

  // 1. Speech Transcription
  let speechTranscript = '';
  if (videoBuffer) {
    speechTranscript = await transcribeVideoAudio(videoBuffer, mimeType);
  }

  // 2. Visual Inspection (via thumbnail or vision service if available)
  let visualSummary = '';
  let isDamagedVisual = false;
  let detectedProduct: string | undefined;

  const visualTargetUrl = payload.thumbnailUrl || payload.videoUrl;
  if (visualTargetUrl) {
    try {
      const visionResult = await VisionServices.analyzeCustomerImage({
        imageUrl: visualTargetUrl,
      });

      visualSummary = visionResult.description || '';
      if (
        visionResult.imageCategory === 'COMPLAINT_DAMAGE' ||
        visionResult.complaintData?.isDamagedJar
      ) {
        isDamagedVisual = true;
      }
      if (visionResult.productMatch?.productName) {
        detectedProduct = visionResult.productMatch.productName;
      }
    } catch (visionErr) {
      console.warn('⚠️ [VideoService] Visual analysis note:', visionErr);
    }
  }

  // 3. Detect Damage in Speech
  const damageKeywords = [
    'ভাঙা',
    'ভেঙ্গে',
    'ভেঙে',
    'নষ্ট',
    'লিক',
    'পড়ে গেছে',
    'ক্ষতিগ্রস্ত',
    'ফাটা',
    'ড্যামেজ',
    'broken',
    'damage',
    'leak',
  ];
  const speechLower = speechTranscript.toLowerCase();
  const isDamagedSpeech = damageKeywords.some((kw) => speechLower.includes(kw));

  const isDamaged = isDamagedVisual || isDamagedSpeech;
  const hasSpeech = speechTranscript.length > 2;
  const isUnclear = !hasSpeech && !visualSummary;

  // 4. Combine Multi-Modal Context
  const combinedParts: string[] = [];
  if (hasSpeech) {
    combinedParts.push(`[ভয়েস/কথা]: "${speechTranscript}"`);
  }
  if (visualSummary) {
    combinedParts.push(`[ভিডিও ভিজ্যুয়াল]: ${visualSummary}`);
  }
  if (isDamaged) {
    combinedParts.push('⚠️ পার্সেল বা মধুর বয়াম ক্ষতিগ্রস্ত/ভাঙা শনাক্ত হয়েছে।');
  }

  const combinedContext =
    combinedParts.length > 0
      ? combinedParts.join('\n')
      : '[ভিডিও মেসেজ প্রদান করা হয়েছে]';

  return {
    speechTranscript,
    visualSummary,
    combinedContext,
    hasSpeech,
    isDamaged,
    detectedProduct,
    isUnclear,
  };
};

export const VideoServices = {
  downloadVideoBuffer,
  transcribeVideoAudio,
  analyzeCustomerVideo,
};

