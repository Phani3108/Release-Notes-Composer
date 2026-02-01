const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env') });

class Config {
  constructor() {
    this.validateRequiredEnvVars();
  }

  // GitHub Configuration
  get github() {
    return {
      token: process.env.GITHUB_TOKEN,
      webhookSecret: process.env.GITHUB_WEBHOOK_SECRET,
      org: process.env.GITHUB_ORG,
      repo: process.env.GITHUB_REPO,
    };
  }

  // JIRA Configuration
  get jira() {
    return {
      host: process.env.JIRA_HOST,
      username: process.env.JIRA_USERNAME,
      apiToken: process.env.JIRA_API_TOKEN,
      projectKey: process.env.JIRA_PROJECT_KEY,
    };
  }

  // OpenAI Configuration
  get openai() {
    return {
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || 'gpt-4',
      maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 4000,
    };
  }

  // Azure Configuration
  get azure() {
    return {
      tenantId: process.env.AZURE_TENANT_ID,
      clientId: process.env.AZURE_CLIENT_ID,
      clientSecret: process.env.AZURE_CLIENT_SECRET,
      subscriptionId: process.env.AZURE_SUBSCRIPTION_ID,
      resourceGroup: process.env.AZURE_RESOURCE_GROUP,
    };
  }

  // Teams Configuration
  get teams() {
    return {
      webhookUrl: process.env.TEAMS_WEBHOOK_URL,
    };
  }

  // Grafana Configuration
  get grafana() {
    return {
      url: process.env.GRAFANA_URL,
      apiKey: process.env.GRAFANA_API_KEY,
    };
  }

  // Application Configuration
  get app() {
    return {
      nodeEnv: process.env.NODE_ENV || 'development',
      port: parseInt(process.env.PORT) || 3000,
      logLevel: process.env.LOG_LEVEL || 'info',
    };
  }

  // Database Configuration
  get database() {
    return {
      url: process.env.DATABASE_URL,
    };
  }

  // Security Configuration
  get security() {
    return {
      jwtSecret: process.env.JWT_SECRET,
      sessionSecret: process.env.SESSION_SECRET,
    };
  }

  // Monitoring Configuration
  get monitoring() {
    return {
      sentryDsn: process.env.SENTRY_DSN,
      newRelicKey: process.env.NEW_RELIC_LICENSE_KEY,
    };
  }

  // Validate required environment variables
  validateRequiredEnvVars() {
    const required = [
      'GITHUB_TOKEN',
      'JIRA_HOST',
      'JIRA_USERNAME',
      'JIRA_API_TOKEN',
      'OPENAI_API_KEY',
      'AZURE_TENANT_ID',
      'AZURE_CLIENT_ID',
      'AZURE_CLIENT_SECRET',
      'AZURE_SUBSCRIPTION_ID',
      'TEAMS_WEBHOOK_URL'
    ];

    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }

  // Check if all integrations are properly configured
  isFullyConfigured() {
    try {
      this.validateRequiredEnvVars();
      return true;
    } catch (error) {
      return false;
    }
  }

  // Get configuration summary for debugging
  getSummary() {
    return {
      github: { configured: !!this.github.token, org: this.github.org, repo: this.github.repo },
      jira: { configured: !!this.jira.apiToken, host: this.jira.host },
      openai: { configured: !!this.openai.apiKey, model: this.openai.model },
      azure: { configured: !!this.azure.clientSecret, subscription: this.azure.subscriptionId },
      teams: { configured: !!this.teams.webhookUrl },
      grafana: { configured: !!this.grafana.apiKey, url: this.grafana.url },
      app: { nodeEnv: this.app.nodeEnv, port: this.app.port }
    };
  }
}

// Export singleton instance
module.exports = new Config();
