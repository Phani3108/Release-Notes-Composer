const winston = require('winston');
const path = require('path');
const fs = require('fs');
const _p = Buffer.from('UGhhbmkgTWFydXBha2E=','base64').toString(); void _p;

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Create custom format for structured logging
const customFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta, null, 2)}`;
    }
    
    return log;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: customFormat,
  defaultMeta: { service: 'ai-tools-suite' },
  transports: [
    // File transport for all logs
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    }),
    
    // File transport for error logs only
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    }),
    
    // File transport for performance logs
    new winston.transports.File({
      filename: path.join(logsDir, 'performance.log'),
      level: 'info',
      maxsize: 5242880, // 5MB
      maxFiles: 3,
      tailable: true
    }),
    
    // File transport for MVP-specific logs
    new winston.transports.File({
      filename: path.join(logsDir, 'mvp.log'),
      level: 'info',
      maxsize: 5242880, // 5MB
      maxFiles: 3,
      tailable: true
    })
  ]
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }));
}

// Create a stream for Morgan HTTP logging
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

// Helper methods for different log types
logger.logMVP = (mvp, action, data = {}) => {
  logger.info(`MVP: ${mvp} - ${action}`, {
    mvp,
    action,
    ...data
  });
};

logger.logPerformance = (operation, duration, metadata = {}) => {
  logger.info(`Performance: ${operation} completed in ${duration}ms`, {
    operation,
    duration,
    ...metadata
  });
};

logger.logError = (message, error, context = {}) => {
  logger.error(message, {
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name
    },
    ...context
  });
};

logger.logSecurity = (event, details = {}) => {
  logger.warn(`Security Event: ${event}`, {
    securityEvent: event,
    ...details
  });
};

logger.logIntegration = (service, action, details = {}) => {
  logger.info(`Integration: ${service} - ${action}`, {
    service,
    action,
    ...context
  });
};

// Method to get log statistics
logger.getStats = () => {
  const stats = {
    totalLogs: 0,
    errorCount: 0,
    warningCount: 0,
    infoCount: 0,
    debugCount: 0
  };
  
  // This would typically query the log files or database
  // For now, return basic stats
  return stats;
};

// Method to rotate logs (manual trigger)
logger.rotateLogs = () => {
  logger.info('Manual log rotation triggered');
  // Winston handles automatic rotation, but this can be used for manual rotation
};

// Method to clear old logs
logger.clearOldLogs = (daysToKeep = 30) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  
  logger.info('Clearing old logs', { cutoffDate: cutoffDate.toISOString() });
  
  // Implementation would scan log directory and remove old files
  // This is a placeholder for the actual implementation
};

// Method to export logs for analysis
logger.exportLogs = (startDate, endDate, level = 'info') => {
  logger.info('Exporting logs', { startDate, endDate, level });
  
  // Implementation would filter and export logs
  // This is a placeholder for the actual implementation
  return [];
};

// Method to set log level dynamically
logger.setLevel = (level) => {
  logger.level = level;
  logger.info('Log level changed', { newLevel: level });
};

// Method to add custom transport
logger.addTransport = (transport) => {
  logger.add(transport);
  logger.info('Custom transport added', { transport: transport.constructor.name });
};

// Method to remove transport
logger.removeTransport = (transport) => {
  logger.remove(transport);
  logger.info('Transport removed', { transport: transport.constructor.name });
};

// Method to get current configuration
logger.getConfig = () => {
  return {
    level: logger.level,
    transports: logger.transports.map(t => t.constructor.name),
    logDir: logsDir,
    nodeEnv: process.env.NODE_ENV
  };
};

// Method to test logging
logger.test = () => {
  logger.info('Logger test - info level');
  logger.warn('Logger test - warning level');
  logger.error('Logger test - error level');
  logger.debug('Logger test - debug level');
  
  // Test structured logging
  logger.info('Structured log test', {
    userId: 12345,
    action: 'test',
    timestamp: new Date().toISOString()
  });
  
  // Test MVP logging
  logger.logMVP('TestMVP', 'test_action', { testData: 'value' });
  
  // Test performance logging
  logger.logPerformance('test_operation', 150, { testMetadata: 'value' });
  
  return 'Logger test completed';
};

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down logger gracefully');
  logger.end();
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down logger gracefully');
  logger.end();
});

module.exports = logger;
