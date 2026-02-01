const axios = require('axios');
const logger = require('../utils/logger');

class TeamsClient {
  constructor(config) {
    this.config = config;
    this.webhookUrl = config.teams.webhookUrl;
    this.tenantId = config.teams.tenantId;
    this.clientId = config.teams.clientId;
    this.clientSecret = config.teams.clientSecret;
    
    logger.logIntegration('teams', 'client_initialized', {
      hasWebhook: !!this.webhookUrl,
      hasAppAuth: !!(this.tenantId && this.clientId && this.clientSecret)
    });
  }

  async testConnection() {
    try {
      if (this.webhookUrl) {
        // Test webhook connection
        const testMessage = {
          type: 'message',
          attachments: [{
            contentType: 'application/vnd.microsoft.card.adaptive',
            content: {
              type: 'AdaptiveCard',
              version: '1.0',
              body: [{
                type: 'TextBlock',
                text: '🔗 Teams Integration Test',
                weight: 'Bolder',
                size: 'Medium'
              }, {
                type: 'TextBlock',
                text: 'This is a test message to verify Teams integration.',
                wrap: true
              }],
              actions: [{
                type: 'Action.Submit',
                title: 'Test Successful',
                data: { test: true }
              }]
            }
          }]
        };

        await this.sendMessage(testMessage);
        
        logger.logIntegration('teams', 'webhook_test_success', {
          webhookUrl: this.webhookUrl
        });
        
        return {
          success: true,
          method: 'webhook',
          message: 'Webhook connection successful'
        };
      } else if (this.tenantId && this.clientId && this.clientSecret) {
        // Test app authentication
        const token = await this.getAccessToken();
        
        logger.logIntegration('teams', 'app_auth_test_success', {
          tenantId: this.tenantId,
          clientId: this.clientId
        });
        
        return {
          success: true,
          method: 'app',
          message: 'App authentication successful',
          token: token.substring(0, 20) + '...'
        };
      } else {
        return {
          success: false,
          error: 'No Teams configuration found'
        };
      }
    } catch (error) {
      logger.logError('Teams connection test failed', error, {
        webhookUrl: this.webhookUrl,
        tenantId: this.tenantId,
        clientId: this.clientId
      });
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  async sendMessage(message) {
    try {
      if (!this.webhookUrl) {
        throw new Error('Teams webhook URL not configured');
      }

      const response = await axios.post(this.webhookUrl, message, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      if (response.status === 200) {
        logger.logIntegration('teams', 'message_sent', {
          webhookUrl: this.webhookUrl,
          messageType: message.type || 'unknown'
        });
        return { success: true, messageId: response.data };
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      logger.logError('Failed to send Teams message', error, {
        webhookUrl: this.webhookUrl,
        message
      });
      throw error;
    }
  }

  async sendReleaseNotes(releaseData, format = 'teams') {
    try {
      let message;
      
      switch (format) {
        case 'teams':
          message = this.createReleaseNotesMessageCard(releaseData);
          break;
        case 'adaptive':
          message = this.createReleaseNotesAdaptiveCard(releaseData);
          break;
        default:
          message = this.createReleaseNotesMessageCard(releaseData);
      }

      const result = await this.sendMessage(message);
      
      logger.logIntegration('teams', 'release_notes_sent', {
        version: releaseData.version,
        format,
        messageId: result.messageId
      });
      
      return result;
    } catch (error) {
      logger.logError('Failed to send release notes to Teams', error, {
        version: releaseData.version,
        format
      });
      throw error;
    }
  }

  createReleaseNotesMessageCard(releaseData) {
    const riskLevel = releaseData.overallRiskLevel || 'low';
    const riskColor = this.getRiskColor(riskLevel);
    
    return {
      type: 'message',
      attachments: [{
        contentType: 'application/vnd.microsoft.card.adaptive',
        content: {
          type: 'AdaptiveCard',
          version: '1.0',
          body: [
            {
              type: 'TextBlock',
              text: `🚀 Release Notes: ${releaseData.version}`,
              weight: 'Bolder',
              size: 'Large',
              color: 'Accent'
            },
            {
              type: 'TextBlock',
              text: `📅 Released: ${new Date(releaseData.releaseDate).toLocaleDateString()}`,
              size: 'Small',
              color: 'Default'
            },
            {
              type: 'FactSet',
              facts: [
                {
                  title: 'Total Changes',
                  value: `${releaseData.totalChanges || 0}`
                },
                {
                  title: 'Risk Level',
                  value: `${riskLevel.toUpperCase()}`
                },
                {
                  title: 'Breaking Changes',
                  value: `${releaseData.breakingChanges?.length || 0}`
                }
              ]
            },
            {
              type: 'TextBlock',
              text: '**What\'s New**',
              weight: 'Bolder',
              size: 'Medium',
              margin: 'Top'
            },
            {
              type: 'TextBlock',
              text: releaseData.featureSummary || 'No new features in this release.',
              wrap: true
            }
          ],
          actions: [
            {
              type: 'Action.OpenUrl',
              title: 'View Full Release Notes',
              url: releaseData.releaseUrl || '#'
            },
            {
              type: 'Action.Submit',
              title: 'Acknowledge Release',
              data: { 
                action: 'acknowledge_release',
                version: releaseData.version 
              }
            }
          ]
        }
      }]
    };
  }

  createReleaseNotesAdaptiveCard(releaseData) {
    const riskLevel = releaseData.overallRiskLevel || 'low';
    const riskColor = this.getRiskColor(riskLevel);
    
    const body = [
      {
        type: 'TextBlock',
        text: `🚀 Release Notes: ${releaseData.version}`,
        weight: 'Bolder',
        size: 'Large',
        color: 'Accent'
      },
      {
        type: 'TextBlock',
        text: `📅 Released: ${new Date(releaseData.releaseDate).toLocaleDateString()}`,
        size: 'Small',
        color: 'Default'
      }
    ];

    // Add risk indicator
    if (riskLevel !== 'low') {
      body.push({
        type: 'TextBlock',
        text: `⚠️ Risk Level: ${riskLevel.toUpperCase()}`,
        color: riskColor,
        weight: 'Bolder'
      });
    }

    // Add breaking changes warning
    if (releaseData.breakingChanges && releaseData.breakingChanges.length > 0) {
      body.push({
        type: 'TextBlock',
        text: `🚨 Breaking Changes: ${releaseData.breakingChanges.length} detected`,
        color: 'Warning',
        weight: 'Bolder'
      });
    }

    // Add summary
    if (releaseData.featureSummary) {
      body.push({
        type: 'TextBlock',
        text: '**What\'s New**',
        weight: 'Bolder',
        size: 'Medium',
        margin: 'Top'
      }, {
        type: 'TextBlock',
        text: releaseData.featureSummary,
        wrap: true
      });
    }

    // Add category breakdown
    if (releaseData.categoryDistribution) {
      const categoryFacts = Object.entries(releaseData.categoryDistribution).map(([category, count]) => ({
        title: category,
        value: count.toString()
      }));

      body.push({
        type: 'TextBlock',
        text: '**Changes by Category**',
        weight: 'Bolder',
        size: 'Medium',
        margin: 'Top'
      }, {
        type: 'FactSet',
        facts: categoryFacts
      });
    }

    return {
      type: 'message',
      attachments: [{
        contentType: 'application/vnd.microsoft.card.adaptive',
        content: {
          type: 'AdaptiveCard',
          version: '1.0',
          body: body,
          actions: [
            {
              type: 'Action.OpenUrl',
              title: 'View Full Release Notes',
              url: releaseData.releaseUrl || '#'
            },
            {
              type: 'Action.Submit',
              title: 'Acknowledge Release',
              data: { 
                action: 'acknowledge_release',
                version: releaseData.version 
              }
            }
          ]
        }
      }]
    };
  }

  async sendIncidentUpdate(incidentData) {
    try {
      const message = {
        type: 'message',
        attachments: [{
          contentType: 'application/vnd.microsoft.card.adaptive',
          content: {
            type: 'AdaptiveCard',
            version: '1.0',
            body: [
              {
                type: 'TextBlock',
                text: `🚨 Incident Update: ${incidentData.title}`,
                weight: 'Bolder',
                size: 'Large',
                color: 'Attention'
              },
              {
                type: 'TextBlock',
                text: `Status: ${incidentData.status}`,
                size: 'Medium',
                color: this.getStatusColor(incidentData.status)
              },
              {
                type: 'TextBlock',
                text: incidentData.description,
                wrap: true
              },
              {
                type: 'FactSet',
                facts: [
                  {
                    title: 'Impact',
                    value: incidentData.impact || 'Unknown'
                  },
                  {
                    title: 'ETA',
                    value: incidentData.eta || 'TBD'
                  },
                  {
                    title: 'Services Affected',
                    value: incidentData.servicesAffected?.join(', ') || 'Unknown'
                  }
                ]
              }
            ],
            actions: [
              {
                type: 'Action.OpenUrl',
                title: 'View Status Page',
                url: incidentData.statusPageUrl || '#'
              },
              {
                type: 'Action.Submit',
                title: 'Acknowledge',
                data: { 
                  action: 'acknowledge_incident',
                  incidentId: incidentData.id 
                }
              }
            ]
          }
        }]
      };

      const result = await this.sendMessage(message);
      
      logger.logIntegration('teams', 'incident_update_sent', {
        incidentId: incidentData.id,
        status: incidentData.status
      });
      
      return result;
    } catch (error) {
      logger.logError('Failed to send incident update to Teams', error, {
        incidentId: incidentData.id
      });
      throw error;
    }
  }

  async sendCostAlert(costData) {
    try {
      const message = {
        type: 'message',
        attachments: [{
          contentType: 'application/vnd.microsoft.card.adaptive',
          content: {
            type: 'AdaptiveCard',
            version: '1.0',
            body: [
              {
                type: 'TextBlock',
                text: `💰 Cost Alert: ${costData.alertType}`,
                weight: 'Bolder',
                size: 'Large',
                color: 'Warning'
              },
              {
                type: 'TextBlock',
                text: costData.description,
                wrap: true
              },
              {
                type: 'FactSet',
                facts: [
                  {
                    title: 'Current Cost',
                    value: `$${costData.currentCost.toFixed(2)}`
                  },
                  {
                    title: 'Previous Period',
                    value: `$${costData.previousCost.toFixed(2)}`
                  },
                  {
                    title: 'Increase',
                    value: `${costData.percentageIncrease.toFixed(1)}%`
                  }
                ]
              }
            ],
            actions: [
              {
                type: 'Action.OpenUrl',
                title: 'View Cost Dashboard',
                url: costData.dashboardUrl || '#'
              },
              {
                type: 'Action.Submit',
                title: 'Investigate',
                data: { 
                  action: 'investigate_cost',
                  alertId: costData.id 
                }
              }
            ]
          }
        }]
      };

      const result = await this.sendMessage(message);
      
      logger.logIntegration('teams', 'cost_alert_sent', {
        alertType: costData.alertType,
        alertId: costData.id
      });
      
      return result;
    } catch (error) {
      logger.logError('Failed to send cost alert to Teams', error, {
        alertType: costData.alertType,
        alertId: costData.id
      });
      throw error;
    }
  }

  async getAccessToken() {
    try {
      const tokenUrl = `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/token`;
      
      const response = await axios.post(tokenUrl, {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        scope: 'https://graph.microsoft.com/.default',
        grant_type: 'client_credentials'
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      return response.data.access_token;
    } catch (error) {
      logger.logError('Failed to get Teams access token', error, {
        tenantId: this.tenantId,
        clientId: this.clientId
      });
      throw error;
    }
  }

  getRiskColor(riskLevel) {
    switch (riskLevel.toLowerCase()) {
      case 'high':
        return 'Attention';
      case 'medium':
        return 'Warning';
      case 'low':
      default:
        return 'Good';
    }
  }

  getStatusColor(status) {
    switch (status.toLowerCase()) {
      case 'resolved':
        return 'Good';
      case 'investigating':
        return 'Warning';
      case 'identified':
        return 'Attention';
      default:
        return 'Default';
    }
  }

  async isConfigured() {
    return !!(this.webhookUrl || (this.tenantId && this.clientId && this.clientSecret));
  }

  getHealthStatus() {
    return {
      service: 'teams',
      configured: this.isConfigured(),
      hasWebhook: !!this.webhookUrl,
      hasAppAuth: !!(this.tenantId && this.clientId && this.clientSecret)
    };
  }
}

module.exports = TeamsClient;
