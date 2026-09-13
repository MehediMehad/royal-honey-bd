import { Worker, type Job } from 'bullmq';
import { MEDIA_QUEUE_NAME, redisConnection } from '../../libs/queue';
import { VoiceServices } from '../voice/voice.service';
import { VisionServices } from '../vision/vision.service';
import { VideoServices } from '../video/video.service';
import { logger } from '../../libs/logger';

export interface IMediaJobData {
  type: 'VOICE' | 'IMAGE_OCR' | 'VIDEO';
  mediaUrl: string;
  channel: 'FACEBOOK' | 'WHATSAPP';
  customerId?: string;
  metadata?: Record<string, unknown>;
}

export const setupMediaWorker = (concurrency = 3) => {
  logger.info(`🎥 [MediaWorker] Setting up horizontal Media Processing Worker (Concurrency: ${concurrency})...`);

  const worker = new Worker(
    MEDIA_QUEUE_NAME,
    async (job: Job<IMediaJobData>) => {
      const { type, mediaUrl, channel } = job.data;
      logger.info(`📥 [MediaWorker] Processing media job #${job.id} (Type: ${type}, Channel: ${channel})`);

      switch (type) {
        case 'VOICE': {
          const result = await VoiceServices.transcribeBanglaAudio({
            audioUrl: mediaUrl,
            channel,
          });
          logger.info(`✅ [MediaWorker] Voice transcribed: "${result.text}" (Provider: ${result.provider})`);
          return result;
        }

        case 'IMAGE_OCR': {
          const result = await VisionServices.analyzeCustomerImage({
            imageUrl: mediaUrl,
          });
          logger.info(`✅ [MediaWorker] Payment image OCR inspected. Category: ${result.imageCategory}`);
          return result;
        }

        case 'VIDEO': {
          const result = await VideoServices.analyzeCustomerVideo({
            videoUrl: mediaUrl,
            channel,
          });
          logger.info(`✅ [MediaWorker] Video analysis complete. Damaged: ${result.isDamaged}`);
          return result;
        }

        default:
          throw new Error(`Unsupported media job type: ${type}`);
      }
    },
    {
      connection: redisConnection,
      concurrency,
    },
  );

  worker.on('completed', (job) => {
    logger.info(`🎉 [MediaWorker] Job #${job.id} completed successfully`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`❌ [MediaWorker] Job #${job?.id} failed`, { error: err.message });
  });

  return worker;
};
