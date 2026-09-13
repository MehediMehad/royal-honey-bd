import { setupChatWorker } from './app/modules/chat/chat.worker';

console.log('🚀 Starting Royal Honey BD BullMQ AI Chat Worker...');

const worker = setupChatWorker();

process.on('SIGTERM', async () => {
  console.log('🛑 Shutting down BullMQ worker...');
  await worker.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 Shutting down BullMQ worker...');
  await worker.close();
  process.exit(0);
});

