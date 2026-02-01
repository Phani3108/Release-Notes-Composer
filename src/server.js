#!/usr/bin/env node

const Server = require('./server');
const { logger } = require('./lib/utils/logger');

async function main() {
  try {
    logger.info('Starting AI Tools Suite Server...');
    
    const server = new Server();
    await server.start();
    
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
  process.exit(1);
});

// Start the server
main();
