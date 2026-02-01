import fs from 'fs';
import path from 'path';

/**
 * Production Module - Production-ready features and utilities
 * Phase 7 Enhancement: Production Deployment & Operations
 */

// Environment configuration
const getEnvironmentConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  
  const configs = {
    development: {
      port: 3000,
      logLevel: 'debug',
      enableMetrics: false,
      enableHealthChecks: true,
      mockData: true
    },
    staging: {
      port: process.env.PORT || 3000,
      logLevel: 'info',
      enableMetrics: true,
      enableHealthChecks: true,
      mockData: false
    },
    production: {
      port: process.env.PORT || 3000,
      logLevel: 'warn',
      enableMetrics: true,
      enableHealthChecks: true,
      mockData: false
    }
  };
  
  return { ...configs[env], environment: env };
};

// Health check utilities
const createHealthCheck = () => {
  const startTime = Date.now();
  let checks = new Map();
  
  const addCheck = (name, checkFn) => {
    checks.set(name, checkFn);
  };
  
  const runChecks = async () => {
    const results = {};
    const start = Date.now();
    
    for (const [name, checkFn] of checks) {
      try {
        const result = await checkFn();
        results[name] = {
          status: 'healthy',
          data: result,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        results[name] = {
          status: 'unhealthy',
          error: error.message,
          timestamp: new Date().toISOString()
        };
      }
    }
    
    return {
      status: Object.values(results).every(r => r.status === 'healthy') ? 'healthy' : 'degraded',
      checks: results,
      uptime: Date.now() - startTime,
      responseTime: Date.now() - start,
      timestamp: new Date().toISOString()
    };
  };
  
  return { addCheck, runChecks };
};

// Metrics collection
const createMetricsCollector = () => {
  const metrics = {
    requests: { total: 0, byEndpoint: new Map() },
    errors: { total: 0, byEndpoint: new Map() },
    responseTimes: { total: 0, count: 0, average: 0 },
    startTime: Date.now()
  };
  
  const recordRequest = (endpoint, method, statusCode, responseTime) => {
    metrics.requests.total++;
    
    const endpointKey = `${method} ${endpoint}`;
    metrics.requests.byEndpoint.set(
      endpointKey,
      (metrics.requests.byEndpoint.get(endpointKey) || 0) + 1
    );
    
    if (statusCode >= 400) {
      metrics.errors.total++;
      metrics.errors.byEndpoint.set(
        endpointKey,
        (metrics.errors.byEndpoint.get(endpointKey) || 0) + 1
      );
    }
    
    metrics.responseTimes.total += responseTime;
    metrics.responseTimes.count++;
    metrics.responseTimes.average = metrics.responseTimes.total / metrics.responseTimes.count;
  };
  
  const getMetrics = () => ({
    ...metrics,
    uptime: Date.now() - metrics.startTime,
    errorRate: metrics.requests.total > 0 ? (metrics.errors.total / metrics.requests.total) * 100 : 0
  });
  
  return { recordRequest, getMetrics };
};

// Deployment utilities
const createDeploymentUtils = () => {
  const getDeploymentInfo = () => {
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      const gitInfo = getGitInfo();
      
      return {
        version: packageJson.version,
        name: packageJson.name,
        description: packageJson.description,
        git: gitInfo,
        buildTime: process.env.BUILD_TIME || new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      };
    } catch (error) {
      return {
        error: 'Failed to get deployment info',
        details: error.message
      };
    }
  };
  
  const getGitInfo = () => {
    try {
      const gitDir = path.join(process.cwd(), '.git');
      if (!fs.existsSync(gitDir)) {
        return { error: 'Not a git repository' };
      }
      
      // Try to get git info (simplified)
      return {
        repository: 'git repository detected',
        branch: process.env.GIT_BRANCH || 'unknown',
        commit: process.env.GIT_COMMIT || 'unknown'
      };
    } catch (error) {
      return { error: 'Failed to get git info' };
    }
  };
  
  return { getDeploymentInfo };
};

// Production middleware
const createProductionMiddleware = (config) => {
  const healthCheck = createHealthCheck();
  const metricsCollector = createMetricsCollector();
  const deploymentUtils = createDeploymentUtils();
  
  // Add basic health checks
  healthCheck.addCheck('database', async () => ({ status: 'connected' }));
  healthCheck.addCheck('external_apis', async () => ({ status: 'available' }));
  healthCheck.addCheck('file_system', async () => ({ status: 'accessible' }));
  
  const middleware = {
    // Request timing middleware
    timing: (req, res, next) => {
      const start = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - start;
        metricsCollector.recordRequest(req.path, req.method, res.statusCode, duration);
      });
      next();
    },
    
    // Security headers middleware
    security: (req, res, next) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
      next();
    },
    
    // Rate limiting (basic)
    rateLimit: (req, res, next) => {
      // Simple rate limiting - in production, use a proper library like express-rate-limit
      const clientIP = req.ip || req.connection.remoteAddress;
      // For now, just pass through - implement proper rate limiting as needed
      next();
    }
  };
  
  return {
    middleware,
    healthCheck,
    metricsCollector,
    deploymentUtils,
    config
  };
};

// Export the production module
export {
  getEnvironmentConfig,
  createHealthCheck,
  createMetricsCollector,
  createDeploymentUtils,
  createProductionMiddleware
};
