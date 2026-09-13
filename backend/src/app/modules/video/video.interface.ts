export interface IVideoAnalysisResult {
  speechTranscript: string;
  visualSummary: string;
  combinedContext: string;
  hasSpeech: boolean;
  isDamaged: boolean;
  detectedProduct?: string;
  isUnclear: boolean;
  durationSeconds?: number;
  raw?: any;
}

export interface IAnalyzeVideoPayload {
  videoUrl?: string;
  thumbnailUrl?: string;
  videoBuffer?: Buffer;
  mimeType?: string;
  channel?: 'FACEBOOK' | 'WHATSAPP';
}

