import express from 'express';
import { 
  createHealthCheck, 
  createMetricsCollector, 
  createDeploymentUtils,
  getEnvironmentConfig 
} from '../modules/production.js';

const router = express.Router();

// Initialize production utilities
const healthCheck = createHealthCheck();
const metricsCollector = createMetricsCollector();
const deploymentUtils = createDeploymentUtils();
const config = getEnvironmentConfig();

// Enhanced health check endpoint
router.get('/health', async (req, res) => {
  try {
    const healthStatus = await healthCheck.runChecks();
    
    res.json({
      status: healthStatus.status,
      timestamp: healthStatus.timestamp,
      uptime: healthStatus.uptime,
      responseTime: healthStatus.responseTime,
      checks: healthStatus.checks,
      environment: config.environment
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Metrics endpoint
router.get('/metrics', (req, res) => {
  try {
    const metrics = metricsCollector.getMetrics();
    
    res.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString(),
      environment: config.environment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Deployment information endpoint
router.get('/deployment', (req, res) => {
  try {
    const deploymentInfo = deploymentUtils.getDeploymentInfo();
    
    res.json({
      success: true,
      data: deploymentInfo,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Environment configuration endpoint
router.get('/config', (req, res) => {
  try {
    // Only expose safe configuration in production
    const safeConfig = {
      environment: config.environment,
      port: config.port,
      logLevel: config.logLevel,
      enableMetrics: config.enableMetrics,
      enableHealthChecks: config.enableHealthChecks,
      mockData: config.mockData
    };
    
    res.json({
      success: true,
      data: safeConfig,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// System status endpoint
router.get('/status', async (req, res) => {
  try {
    const healthStatus = await healthCheck.runChecks();
    const metrics = metricsCollector.getMetrics();
    const deploymentInfo = deploymentUtils.getDeploymentInfo();
    
    res.json({
      success: true,
      data: {
        health: healthStatus,
        metrics: {
          uptime: metrics.uptime,
          requestCount: metrics.requests.total,
          errorRate: metrics.errorRate,
          averageResponseTime: metrics.responseTimes.average
        },
        deployment: {
          version: deploymentInfo.version,
          environment: deploymentInfo.environment,
          uptime: metrics.uptime
        },
        system: {
          nodeVersion: deploymentInfo.nodeVersion,
          platform: deploymentInfo.platform,
          memory: process.memoryUsage(),
          cpu: process.cpuUsage()
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Performance profiling endpoint
router.get('/profile', (req, res) => {
  try {
    const metrics = metricsCollector.getMetrics();
    
    // Calculate performance insights
    const performance = {
      totalRequests: metrics.requests.total,
      errorRate: metrics.errorRate,
      averageResponseTime: metrics.responseTimes.average,
      uptime: metrics.uptime,
      requestsPerMinute: metrics.uptime > 0 ? (metrics.requests.total / (metrics.uptime / 60000)).toFixed(2) : 0,
      topEndpoints: Array.from(metrics.requests.byEndpoint.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([endpoint, count]) => ({ endpoint, count }))
    };
    
    res.json({
      success: true,
      data: performance,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export { router as productionRouter };
