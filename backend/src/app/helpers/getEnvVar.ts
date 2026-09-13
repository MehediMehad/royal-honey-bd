import httpStatus from 'http-status';
import ApiError from '../errors/ApiError';

export const getEnvVar = (key: string, fallback?: string): string => {
  const value = process.env[key];

  if (value === undefined && fallback === undefined) {
    console.error(`Environment variable ${key} is not set`);
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      `Environment variable ${key} is not set`,
    );
  }
  return value !== undefined ? value : fallback!;
};

