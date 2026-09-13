import path from 'path';
import dotenv from 'dotenv';
import { getEnvVar } from '../app/helpers/getEnvVar';

dotenv.config({ path: path.join(process.cwd(), '.env'), override: true });

const config = {
  app: {
    env: getEnvVar('NODE_ENV', 'development'),
    port: Number(getEnvVar('PORT', '5000')),
    cors_origins: getEnvVar('CORS_ORIGINS', 'http://localhost:3000').split(','),
  },
  admin: {
    email: getEnvVar('ADMIN_EMAIL', 'admin@royalhoneybd.com'),
    password: getEnvVar('ADMIN_PASSWORD', 'AdminPassword123!'),
  },
  jwt: {
    access_secret: getEnvVar('JWT_ACCESS_SECRET', 'royal_honey_jwt_access_secret_123'),
    access_expires_in: getEnvVar('JWT_ACCESS_EXPIRES_IN', '7d'),
    refresh_secret: getEnvVar('JWT_REFRESH_SECRET', 'royal_honey_jwt_refresh_secret_123'),
    refresh_expires_in: getEnvVar('JWT_REFRESH_EXPIRES_IN', '30d'),
    bcrypt_salt_rounds: Number(getEnvVar('BCRYPT_SALT_ROUNDS', '12')),
  },
  redis: {
    host: getEnvVar('REDIS_HOST', 'localhost'),
    port: Number(getEnvVar('REDIS_PORT', '6379')),
    password: getEnvVar('REDIS_PASSWORD', ''),
  },
  gemini: {
    apiKey: getEnvVar('GEMINI_API_KEY', ''),
  },
  urls: {
    frontend_url: getEnvVar('FRONTEND_URL', 'http://localhost:3000'),
    backend_url: getEnvVar('BACKEND_URL', 'http://localhost:5000'),
  },
};

export default config;

