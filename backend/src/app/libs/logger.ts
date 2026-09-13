import fs from 'fs';
import path from 'path';
import config from '../../configs';

type LogLevel = 'error' | 'warn' | 'info' | 'http' | 'debug';

const logDir = path.resolve(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  try {
    fs.mkdirSync(logDir, { recursive: true });
  } catch {
    // Ignore error in read-only environments
  }
}

const errorLogPath = path.join(logDir, 'error.log');
const combinedLogPath = path.join(logDir, 'combined.log');

const writeToFile = (filePath: string, text: string) => {
  try {
    fs.appendFile(filePath, text + '\n', () => { });
  } catch {
    // Non-blocking file write
  }
};

const formatMessage = (level: LogLevel, message: string, meta?: any) => {
  const timestamp = new Date().toISOString();

  if (config.app.env === 'production') {
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...(meta && typeof meta === 'object' ? meta : meta ? { meta } : {}),
    });
  }

  // Development formatting
  const colors: Record<LogLevel, string> = {
    error: '\x1b[31m', // Red
    warn: '\x1b[33m',  // Yellow
    info: '\x1b[36m',  // Cyan
    http: '\x1b[35m',  // Magenta
    debug: '\x1b[90m', // Gray
  };
  const reset = '\x1b[0m';
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
  return `${colors[level]}[${timestamp}] [${level.toUpperCase()}]${reset}: ${message}${metaStr}`;
};

const log = (level: LogLevel, message: string, meta?: any) => {
  const formatted = formatMessage(level, message, meta);

  if (level === 'error') {
    console.error(formatted);
    writeToFile(errorLogPath, formatted);
    writeToFile(combinedLogPath, formatted);
  } else {
    console.log(formatted);
    writeToFile(combinedLogPath, formatted);
  }
};

export const logger = {
  error: (message: string, meta?: any) => log('error', message, meta),
  warn: (message: string, meta?: any) => log('warn', message, meta),
  info: (message: string, meta?: any) => log('info', message, meta),
  http: (message: string, meta?: any) => log('http', message, meta),
  debug: (message: string, meta?: any) => log('debug', message, meta),
  captureException: (err: any, context?: Record<string, any>) => {
    const errorDetails = {
      message: err?.message || String(err),
      stack: err?.stack,
      context,
    };
    log('error', `🚨 Exception Captured: ${errorDetails.message}`, errorDetails);
  },
};
