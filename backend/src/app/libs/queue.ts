import { Queue } from 'bullmq';
import config from '../../configs';

export const CHAT_QUEUE_NAME = 'chat-messages';

export const redisConnection = {
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password || undefined,
  maxRetriesPerRequest: null,
};

export const chatMessageQueue = new Queue(CHAT_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: {
      age: 3600,
      count: 1000,
    },
    removeOnFail: {
      age: 24 * 3600,
      count: 5000,
    },
  },
});

