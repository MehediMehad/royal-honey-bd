import Redis from 'ioredis';
import config from '../../configs';

export const redis = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password || undefined,
  lazyConnect: true,
});

redis.on('connect', () => {
  console.log('⚡ Redis connected successfully');
});

redis.on('error', (err) => {
  console.error('❌ Redis connection error:', err?.message || err);
});

