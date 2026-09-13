import { setupChatWorker } from './app/modules/chat/chat.worker';
import { setupMediaWorker } from './app/modules/media/media.worker';
import { logger } from './app/libs/logger';

const role = process.env.WORKER_ROLE || 'all';
logger.info(`🚀 Starting Royal Honey BD BullMQ Worker (Role: ${role.toUpperCase()})...`);

const activeWorkers: Array<{ close: () => Promise<void> }> = [];

if (role === 'ai' || role === 'all') {
  logger.info('🤖 Initializing BullMQ AI Chat & RAG Worker...');
  const chatWorker = setupChatWorker();
  activeWorkers.push(chatWorker);
}

if (role === 'media' || role === 'all') {
  logger.info('🎥 Initializing BullMQ Media Processing Worker...');
  const mediaWorker = setupMediaWorker();
  activeWorkers.push(mediaWorker);
}

const shutdown = async () => {
  logger.info('🛑 Shutting down BullMQ workers gracefully...');
  for (const w of activeWorkers) {
    await w.close();
  }
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);


