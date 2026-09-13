export interface ITranscriptionResult {
  text: string;
  language?: string;
  duration?: number;
  isAmbiguous: boolean;
  confidence?: number;
  provider: 'whisper' | 'mock';
  raw?: any;
}

export interface IAudioProcessPayload {
  audioUrl?: string;
  audioBuffer?: Buffer;
  mimeType?: string;
  channel?: 'FACEBOOK' | 'WHATSAPP';
}

