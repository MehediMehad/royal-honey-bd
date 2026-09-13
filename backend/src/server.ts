import type { Server as HttpServer } from 'http';
import app from './app';
import config from './configs';

let server: HttpServer;

async function main() {
  try {
    const port = config.app.port || 5000;
    server = app.listen(port, () => {
      console.log(`🚀 Royal Honey BD server running on port ${port}`);
      console.log(`🍯 Environment: ${config.app.env}`);
      console.log(`🌐 Base API URL: http://localhost:${port}/api/v1`);
    });

    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      shutdown();
    });

    process.on('unhandledRejection', (reason) => {
      console.error('❌ Unhandled Rejection:', reason);
      shutdown();
    });

    process.on('SIGTERM', () => {
      console.info('🔁 SIGTERM received.');
      shutdown();
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

function shutdown() {
  if (server) {
    server.close(() => {
      console.info('🔒 Server closed gracefully.');
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
}

main();

