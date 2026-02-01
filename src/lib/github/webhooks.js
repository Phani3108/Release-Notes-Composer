const crypto = require('crypto');
const { logger } = require('../utils/logger');

class GitHubWebhookHandler {
  constructor(config, releaseNotesComposer) {
    this.config = config;
    this.releaseNotesComposer = releaseNotesComposer;
    this.secret = config.getGitHubConfig().webhookSecret;
  }

  /**
   * Verify webhook signature from GitHub
   */
  verifySignature(payload, signature) {
    if (!this.secret) {
      logger.warn('GitHub webhook secret not configured, skipping signature verification');
      return true;
    }

    const expectedSignature = `sha256=${crypto
      .createHmac('sha256', this.secret)
      .update(payload)
      .digest('hex')}`;

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Handle incoming webhook events
   */
  async handleWebhook(event, payload, signature) {
    try {
      // Verify webhook signature
      if (!this.verifySignature(payload, signature)) {
        logger.warn('Invalid webhook signature', { event });
        throw new Error('Invalid webhook signature');
      }

      logger.info('Processing GitHub webhook', { event, payload: JSON.stringify(payload) });

      switch (event) {
        case 'release':
          return await this.handleReleaseEvent(payload);
        
        case 'pull_request':
          return await this.handlePullRequestEvent(payload);
        
        case 'push':
          return await this.handlePushEvent(payload);
        
        case 'create':
          return await this.handleCreateEvent(payload);
        
        default:
          logger.info('Unhandled webhook event', { event });
          return { status: 'ignored', reason: 'Event not handled' };
      }
    } catch (error) {
      logger.error('Error handling webhook', { event, error: error.message });
      throw error;
    }
  }

  /**
   * Handle release events (when a new release is created)
   */
  async handleReleaseEvent(payload) {
    const { action, release } = payload;
    
    if (action === 'created' || action === 'published') {
      logger.info('New release detected, generating release notes', {
        version: release.tag_name,
        action
      });

      try {
        // Generate release notes for the new version
        const releaseData = await this.releaseNotesComposer.generateReleaseNotes(
          release.tag_name,
          {
            includeBreakingChanges: true,
            includeMigrationNotes: true,
            sendToTeams: true
          }
        );

        logger.info('Release notes generated successfully', {
          version: release.tag_name,
          prCount: releaseData.pullRequests?.length || 0,
          riskLevel: releaseData.overallRiskLevel
        });

        return {
          status: 'success',
          action: 'release_notes_generated',
          version: release.tag_name,
          data: releaseData
        };
      } catch (error) {
        logger.error('Failed to generate release notes for new release', {
          version: release.tag_name,
          error: error.message
        });
        throw error;
      }
    }

    return { status: 'ignored', reason: 'Release action not handled' };
  }

  /**
   * Handle pull request events (when PRs are merged)
   */
  async handlePullRequestEvent(payload) {
    const { action, pull_request, repository } = payload;
    
    if (action === 'closed' && pull_request.merged) {
      logger.info('PR merged, updating release notes tracking', {
        prNumber: pull_request.number,
        title: pull_request.title,
        repository: repository.full_name
      });

      // This could trigger a preview or update of pending release notes
      // For now, we'll just log the event
      return {
        status: 'success',
        action: 'pr_merged_tracked',
        prNumber: pull_request.number,
        title: pull_request.title
      };
    }

    return { status: 'ignored', reason: 'PR action not handled' };
  }

  /**
   * Handle push events (when code is pushed to main/master)
   */
  async handlePushEvent(payload) {
    const { ref, repository } = payload;
    
    // Check if this is a push to main/master branch
    if (ref === 'refs/heads/main' || ref === 'refs/heads/master') {
      logger.info('Push to main branch detected', {
        repository: repository.full_name,
        ref,
        commitCount: payload.commits?.length || 0
      });

      // This could trigger a preview of what the next release notes might look like
      return {
        status: 'success',
        action: 'main_branch_push_tracked',
        repository: repository.full_name,
        commitCount: payload.commits?.length || 0
      };
    }

    return { status: 'ignored', reason: 'Push not to main branch' };
  }

  /**
   * Handle create events (when tags are created)
   */
  async handleCreateEvent(payload) {
    const { ref_type, ref, repository } = payload;
    
    if (ref_type === 'tag') {
      logger.info('New tag created, generating release notes', {
        tag: ref,
        repository: repository.full_name
      });

      try {
        // Generate release notes for the new tag
        const releaseData = await this.releaseNotesComposer.generateReleaseNotes(
          ref,
          {
            includeBreakingChanges: true,
            includeMigrationNotes: true,
            sendToTeams: true
          }
        );

        logger.info('Release notes generated for new tag', {
          tag: ref,
          prCount: releaseData.pullRequests?.length || 0,
          riskLevel: releaseData.overallRiskLevel
        });

        return {
          status: 'success',
          action: 'tag_release_notes_generated',
          tag: ref,
          data: releaseData
        };
      } catch (error) {
        logger.error('Failed to generate release notes for new tag', {
          tag: ref,
          error: error.message
        });
        throw error;
      }
    }

    return { status: 'ignored', reason: 'Create event not a tag' };
  }

  /**
   * Get webhook configuration for GitHub
   */
  getWebhookConfig() {
    return {
      url: `${this.config.getAppConfig().baseUrl}/api/v1/webhooks/github`,
      events: ['release', 'pull_request', 'push', 'create'],
      secret: this.secret,
      contentType: 'json'
    };
  }

  /**
   * Validate webhook payload
   */
  validatePayload(payload) {
    if (!payload || typeof payload !== 'object') {
      throw new Error('Invalid payload format');
    }

    // Add more validation as needed
    return true;
  }
}

module.exports = GitHubWebhookHandler;
