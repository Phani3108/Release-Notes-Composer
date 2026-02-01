const GitHubClient = require('../../lib/github/client');
const JiraClient = require('../../lib/jira/client');
const OpenAIClient = require('../../lib/openai/client');
const TeamsClient = require('../../lib/teams/client');
const ReleaseNotesGenerator = require('./generator');
const ReleaseNotesFormatter = require('./formatter');
const logger = require('../../lib/utils/logger');

class ReleaseNotesComposer {
  constructor(config) {
    this.config = config;
    
    // Initialize clients
    this.githubClient = new GitHubClient(config);
    this.jiraClient = new JiraClient(config);
    this.openaiClient = new OpenAIClient(config);
    this.teamsClient = new TeamsClient(config);
    
    // Initialize core components
    this.generator = new ReleaseNotesGenerator(
      this.githubClient,
      this.jiraClient,
      this.openaiClient
    );
    this.formatter = new ReleaseNotesFormatter();
    
    logger.logMVP('release-notes', 'composer_initialized', {
      hasGitHub: this.githubClient.isConfigured(),
      hasJira: this.jiraClient.isConfigured(),
      hasOpenAI: this.openaiClient.isConfigured(),
      hasTeams: this.teamsClient.isConfigured()
    });
  }

  async generateReleaseNotes(version, options = {}) {
    const startTime = Date.now();
    
    try {
      logger.logMVP('release-notes', 'generation_started', {
        version,
        options
      });

      // Generate release data
      const releaseData = await this.generator.generateReleaseData(version, options);
      
      // Format the release notes
      const formattedNotes = await this.formatter.formatReleaseNotes(releaseData, options.format || 'markdown');
      
      const duration = Date.now() - startTime;
      
      logger.logPerformance('release_notes_generation', duration, {
        version,
        format: options.format || 'markdown',
        totalChanges: releaseData.totalChanges || 0
      });
      
      logger.logMVP('release-notes', 'generation_completed', {
        version,
        duration,
        format: options.format || 'markdown',
        totalChanges: releaseData.totalChanges || 0
      });

      return {
        success: true,
        version,
        releaseData,
        formattedNotes,
        format: options.format || 'markdown',
        duration
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.logError('Release notes generation failed', error, {
        version,
        options,
        duration
      });
      
      throw error;
    }
  }

  async generateLatestReleaseNotes(options = {}) {
    try {
      // Get the latest release from GitHub
      const releases = await this.githubClient.getReleases({ per_page: 1 });
      
      if (releases.length === 0) {
        throw new Error('No releases found in the repository');
      }
      
      const latestRelease = releases[0];
      return this.generateReleaseNotes(latestRelease.tag_name, options);
    } catch (error) {
      logger.logError('Failed to generate latest release notes', error);
      throw error;
    }
  }

  async generateReleaseNotesForDateRange(startDate, endDate, options = {}) {
    const startTime = Date.now();
    
    try {
      logger.logMVP('release-notes', 'date_range_generation_started', {
        startDate,
        endDate,
        options
      });

      // Generate release data for date range
      const releaseData = await this.generator.generateReleaseDataForDateRange(startDate, endDate, options);
      
      // Format the release notes
      const formattedNotes = await this.formatter.formatReleaseNotes(releaseData, options.format || 'markdown');
      
      const duration = Date.now() - startTime;
      
      logger.logPerformance('release_notes_date_range_generation', duration, {
        startDate,
        endDate,
        format: options.format || 'markdown',
        totalChanges: releaseData.totalChanges || 0
      });
      
      logger.logMVP('release-notes', 'date_range_generation_completed', {
        startDate,
        endDate,
        duration,
        format: options.format || 'markdown',
        totalChanges: releaseData.totalChanges || 0
      });

      return {
        success: true,
        startDate,
        endDate,
        releaseData,
        formattedNotes,
        format: options.format || 'markdown',
        duration
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.logError('Release notes date range generation failed', error, {
        startDate,
        endDate,
        options,
        duration
      });
      
      throw error;
    }
  }

  async previewReleaseNotes(version, options = {}) {
    try {
      logger.logMVP('release-notes', 'preview_requested', {
        version,
        options
      });

      // Generate release data without final formatting
      const releaseData = await this.generator.generateReleaseData(version, { ...options, preview: true });
      
      // Return preview data
      return {
        success: true,
        version,
        releaseData,
        preview: true,
        totalChanges: releaseData.totalChanges || 0,
        riskLevel: releaseData.overallRiskLevel || 'low',
        breakingChanges: releaseData.breakingChanges?.length || 0
      };
    } catch (error) {
      logger.logError('Release notes preview failed', error, {
        version,
        options
      });
      throw error;
    }
  }

  async sendReleaseNotesToTeams(version, format = 'teams') {
    try {
      logger.logMVP('release-notes', 'teams_notification_started', {
        version,
        format
      });

      // Generate release notes
      const result = await this.generateReleaseNotes(version, { format: 'json' });
      
      // Send to Teams
      const teamsResult = await this.teamsClient.sendReleaseNotes(result.releaseData, format);
      
      logger.logMVP('release-notes', 'teams_notification_completed', {
        version,
        format,
        teamsMessageId: teamsResult.messageId
      });

      return {
        success: true,
        version,
        teamsResult,
        releaseData: result.releaseData
      };
    } catch (error) {
      logger.logError('Failed to send release notes to Teams', error, {
        version,
        format
      });
      throw error;
    }
  }

  async getReleaseNotesStats(version) {
    try {
      logger.logMVP('release-notes', 'stats_requested', { version });

      const stats = await this.generator.getReleaseStats(version);
      
      logger.logMVP('release-notes', 'stats_retrieved', {
        version,
        stats
      });

      return stats;
    } catch (error) {
      logger.logError('Failed to get release notes stats', error, { version });
      throw error;
    }
  }

  async validateConfiguration() {
    try {
      const results = {
        github: await this.githubClient.testConnection(),
        jira: await this.jiraClient.testConnection(),
        openai: await this.openaiClient.testConnection(),
        teams: await this.teamsClient.testConnection()
      };

      const allSuccessful = Object.values(results).every(result => result.success);
      
      logger.logMVP('release-notes', 'configuration_validated', {
        results,
        allSuccessful
      });

      return {
        success: allSuccessful,
        results
      };
    } catch (error) {
      logger.logError('Configuration validation failed', error);
      throw error;
    }
  }

  getHealthStatus() {
    return {
      service: 'release-notes-composer',
      timestamp: new Date().toISOString(),
      clients: {
        github: this.githubClient.getHealthStatus(),
        jira: this.jiraClient.getHealthStatus(),
        openai: this.openaiClient.getHealthStatus(),
        teams: this.teamsClient.getHealthStatus()
      },
      components: {
        generator: 'initialized',
        formatter: 'initialized'
      }
    };
  }

  async cleanup() {
    try {
      logger.logMVP('release-notes', 'cleanup_started');
      
      // Cleanup any resources if needed
      // For now, just log the cleanup
      
      logger.logMVP('release-notes', 'cleanup_completed');
    } catch (error) {
      logger.logError('Cleanup failed', error);
    }
  }
}

module.exports = ReleaseNotesComposer;
