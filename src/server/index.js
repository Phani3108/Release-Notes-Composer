const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { Config } = require('../lib/config');
const { logger } = require('../lib/utils/logger');
const ReleaseNotesComposer = require('../mvp/release-notes');

class Server {
  constructor() {
    this.app = express();
    this.config = new Config();
    this.port = this.config.getAppConfig().port || 3001;
    this.releaseNotesComposer = null;
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  setupMiddleware() {
    // Security middleware
    this.app.use(helmet());
    
    // CORS configuration
    this.app.use(cors({
      origin: this.config.getAppConfig().allowedOrigins || ['http://localhost:3000'],
      credentials: true
    }));
    
    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
    
    // Request logging
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
      });
      next();
    });
  }

  setupRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: this.config.getAppConfig().version || '1.0.0'
      });
    });

    // API routes
    this.app.use('/api/v1', this.setupAPIRoutes());
    
    // Catch-all for undefined routes
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Route not found',
        path: req.originalUrl,
        timestamp: new Date().toISOString()
      });
    });
  }

  setupAPIRoutes() {
    const router = express.Router();
    
    // Initialize Release Notes Composer
    router.use('/release-notes/*', (req, res, next) => {
      if (!this.releaseNotesComposer) {
        try {
          this.releaseNotesComposer = new ReleaseNotesComposer(this.config);
          logger.info('Release Notes Composer initialized');
        } catch (error) {
          logger.error('Failed to initialize Release Notes Composer', error);
          return res.status(500).json({
            error: 'Failed to initialize Release Notes Composer',
            details: error.message
          });
        }
      }
      next();
    });

    // Release Notes endpoints
    router.get('/release-notes/health', async (req, res) => {
      try {
        const health = await this.releaseNotesComposer.getHealthStatus();
        res.json(health);
      } catch (error) {
        logger.error('Health check failed', error);
        res.status(500).json({
          error: 'Health check failed',
          details: error.message
        });
      }
    });

    router.post('/release-notes/generate', async (req, res) => {
      try {
        const { version, options = {} } = req.body;
        
        if (!version) {
          return res.status(400).json({
            error: 'Version is required',
            details: 'Please provide a version number for the release notes'
          });
        }

        logger.info('Generating release notes', { version, options });
        const releaseData = await this.releaseNotesComposer.generateReleaseNotes(version, options);
        
        res.json({
          success: true,
          data: releaseData,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        logger.error('Failed to generate release notes', error);
        res.status(500).json({
          error: 'Failed to generate release notes',
          details: error.message
        });
      }
    });

    router.post('/release-notes/generate-latest', async (req, res) => {
      try {
        const { options = {} } = req.body;
        
        logger.info('Generating latest release notes', { options });
        const releaseData = await this.releaseNotesComposer.generateLatestReleaseNotes(options);
        
        res.json({
          success: true,
          data: releaseData,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        logger.error('Failed to generate latest release notes', error);
        res.status(500).json({
          error: 'Failed to generate latest release notes',
          details: error.message
        });
      }
    });

    router.post('/release-notes/generate-date-range', async (req, res) => {
      try {
        const { startDate, endDate, options = {} } = req.body;
        
        if (!startDate || !endDate) {
          return res.status(400).json({
            error: 'Start and end dates are required',
            details: 'Please provide both startDate and endDate in YYYY-MM-DD format'
          });
        }

        logger.info('Generating release notes for date range', { startDate, endDate, options });
        const releaseData = await this.releaseNotesComposer.generateReleaseNotesForDateRange(
          startDate, 
          endDate, 
          options
        );
        
        res.json({
          success: true,
          data: releaseData,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        logger.error('Failed to generate release notes for date range', error);
        res.status(500).json({
          error: 'Failed to generate release notes for date range',
          details: error.message
        });
      }
    });

    router.post('/release-notes/preview', async (req, res) => {
      try {
        const { version, options = {} } = req.body;
        
        if (!version) {
          return res.status(400).json({
            error: 'Version is required',
            details: 'Please provide a version number for the preview'
          });
        }

        logger.info('Generating release notes preview', { version, options });
        const releaseData = await this.releaseNotesComposer.previewReleaseNotes(version, options);
        
        res.json({
          success: true,
          data: releaseData,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        logger.error('Failed to generate release notes preview', error);
        res.status(500).json({
          error: 'Failed to generate release notes preview',
          details: error.message
        });
      }
    });

    router.post('/release-notes/send-to-teams', async (req, res) => {
      try {
        const { version, format = 'markdown' } = req.body;
        
        if (!version) {
          return res.status(400).json({
            error: 'Version is required',
            details: 'Please provide a version number'
          });
        }

        logger.info('Sending release notes to Teams', { version, format });
        const result = await this.releaseNotesComposer.sendReleaseNotesToTeams(version, format);
        
        res.json({
          success: true,
          message: 'Release notes sent to Teams successfully',
          data: result,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        logger.error('Failed to send release notes to Teams', error);
        res.status(500).json({
          error: 'Failed to send release notes to Teams',
          details: error.message
        });
      }
    });

    // Configuration validation endpoint
    router.get('/config/validate', (req, res) => {
      try {
        const isValid = this.config.isFullyConfigured();
        const missingVars = this.config.validateRequiredEnvVars();
        
        res.json({
          isValid,
          missingVars,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        logger.error('Configuration validation failed', error);
        res.status(500).json({
          error: 'Configuration validation failed',
          details: error.message
        });
      }
    });

    // GitHub webhook endpoint
    router.post('/webhooks/github', async (req, res) => {
      try {
        const signature = req.headers['x-hub-signature-256'];
        const event = req.headers['x-github-event'];
        const payload = req.body;

        if (!signature || !event) {
          return res.status(400).json({
            error: 'Missing required headers',
            details: 'x-hub-signature-256 and x-github-event headers are required'
          });
        }

        // Initialize webhook handler if not already done
        if (!this.githubWebhookHandler) {
          const GitHubWebhookHandler = require('../lib/github/webhooks');
          this.githubWebhookHandler = new GitHubWebhookHandler(this.config, this.releaseNotesComposer);
        }

        const result = await this.githubWebhookHandler.handleWebhook(event, payload, signature);
        
        res.json({
          success: true,
          result,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        logger.error('GitHub webhook processing failed', error);
        res.status(500).json({
          error: 'Webhook processing failed',
          details: error.message
        });
      }
    });

    return router;
  }

  setupErrorHandling() {
    // Global error handler
    this.app.use((error, req, res, next) => {
      logger.error('Unhandled error', {
        error: error.message,
        stack: error.stack,
        path: req.path,
        method: req.method
      });

      res.status(500).json({
        error: 'Internal server error',
        message: 'Something went wrong on our end',
        timestamp: new Date().toISOString()
      });
    });
  }

  async start() {
    try {
      // Validate configuration before starting
      if (!this.config.isFullyConfigured()) {
        const missingVars = this.config.validateRequiredEnvVars();
        logger.warn('Configuration incomplete', { missingVars });
      }

      // Test external service connections
      await this.testExternalConnections();

      this.server = this.app.listen(this.port, () => {
        logger.info(`Server started successfully`, {
          port: this.port,
          environment: this.config.getAppConfig().environment || 'development',
          timestamp: new Date().toISOString()
        });
      });

      // Graceful shutdown
      process.on('SIGTERM', () => this.shutdown());
      process.on('SIGINT', () => this.shutdown());

    } catch (error) {
      logger.error('Failed to start server', error);
      process.exit(1);
    }
  }

  async testExternalConnections() {
    logger.info('Testing external service connections...');
    
    try {
      // Test GitHub connection
      if (this.config.getGitHubConfig().enabled) {
        const githubClient = require('../lib/github/client');
        const github = new githubClient(this.config);
        await github.testConnection();
        logger.info('GitHub connection successful');
      }

      // Test JIRA connection
      if (this.config.getJiraConfig().enabled) {
        const jiraClient = require('../lib/jira/client');
        const jira = new jiraClient(this.config);
        await jira.testConnection();
        logger.info('JIRA connection successful');
      }

      // Test OpenAI connection
      if (this.config.getOpenAIConfig().enabled) {
        const openaiClient = require('../lib/openai/client');
        const openai = new openaiClient(this.config);
        await openai.testConnection();
        logger.info('OpenAI connection successful');
      }

      // Test Teams connection
      if (this.config.getTeamsConfig().enabled) {
        const teamsClient = require('../lib/teams/client');
        const teams = new teamsClient(this.config);
        await teams.testConnection();
        logger.info('Teams connection successful');
      }

      logger.info('All external service connections successful');
    } catch (error) {
      logger.warn('Some external service connections failed', { error: error.message });
      // Don't fail startup for connection issues, just log warnings
    }
  }

  async shutdown() {
    logger.info('Shutting down server gracefully...');
    
    try {
      if (this.releaseNotesComposer) {
        await this.releaseNotesComposer.cleanup();
      }
      
      if (this.server) {
        this.server.close(() => {
          logger.info('Server shutdown complete');
          process.exit(0);
        });
      } else {
        process.exit(0);
      }
    } catch (error) {
      logger.error('Error during shutdown', error);
      process.exit(1);
    }
  }
}

module.exports = Server;
