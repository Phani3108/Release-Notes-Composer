# 🚀 Quick Start Guide - Release Notes Composer MVP

This guide will get you up and running with the **Release Notes Composer** MVP in under 10 minutes!

## 🎯 What We're Building

The Release Notes Composer automatically generates customer-ready release notes by:
- **Ingesting Data**: Pulling merged PRs, JIRA tickets, and commit histories
- **Feature Clustering**: Organizing PRs by feature/module using AI
- **Risk Tagging**: Identifying breaking changes, performance impact, and compliance issues
- **Output Generation**: Creating HTML/Markdown and Teams/Confluence content

## 📋 Prerequisites

- Node.js 18+ and npm
- GitHub Personal Access Token
- JIRA API Token
- OpenAI API Key
- Microsoft Teams Webhook URL (optional)

## 🚀 Quick Start (5 minutes)

### 1. Clone and Setup
```bash
# Clone the repository
git clone <your-repo-url>
cd Release-Notes-Composer

# Install dependencies
npm install

# Run the setup script
npm run setup
```

### 2. Configure Environment
```bash
# Copy the environment template
cp env.template .env

# Edit .env with your credentials
nano .env
```

**Required Variables:**
```bash
# GitHub Integration
GITHUB_TOKEN=ghp_your_token_here
GITHUB_ORG=your_organization
GITHUB_REPO=your_repository

# JIRA Integration  
JIRA_HOST=https://your-domain.atlassian.net
JIRA_USERNAME=your_email@domain.com
JIRA_API_TOKEN=your_api_token
JIRA_PROJECT_KEY=PROJ

# OpenAI Integration
OPENAI_API_KEY=sk-your_key_here
OPENAI_MODEL=gpt-4

# Teams Integration (optional)
TEAMS_WEBHOOK_URL=https://your-domain.webhook.office.com/webhookb2/your_webhook_id
```

### 3. Start the Backend Server
```bash
# Start the Express server
npm run server

# Or for development with auto-reload
npm run server:dev
```

The server will start on `http://localhost:3001`

### 4. Start the Frontend
```bash
# In a new terminal, start Next.js
npm run dev
```

The frontend will be available at `http://localhost:3000`

### 5. Test the Integration
Visit `http://localhost:3000/demo` to see the Release Notes Composer in action!

## 🔧 Configuration Details

### GitHub Setup
1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Generate a new token with `repo` and `read:org` scopes
3. Add the token to your `.env` file

### JIRA Setup
1. Go to JIRA Settings → Security → API tokens
2. Create a new API token
3. Use your email + API token for authentication

### OpenAI Setup
1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create a new API key
3. Add it to your `.env` file

### Teams Webhook Setup
1. In Teams, go to the channel where you want notifications
2. Click the "..." menu → Connectors
3. Configure an "Incoming Webhook"
4. Copy the webhook URL to your `.env` file

## 🧪 Testing the MVP

### 1. Health Check
```bash
curl http://localhost:3001/health
```

### 2. Configuration Validation
```bash
curl http://localhost:3001/api/v1/config/validate
```

### 3. Generate Release Notes
```bash
curl -X POST http://localhost:3001/api/v1/release-notes/generate \
  -H "Content-Type: application/json" \
  -d '{"version": "v1.0.0"}'
```

### 4. Test GitHub Webhook
```bash
# Simulate a release event
curl -X POST http://localhost:3001/api/v1/webhooks/github \
  -H "Content-Type: application/json" \
  -H "x-github-event: release" \
  -d '{"action": "created", "release": {"tag_name": "v1.0.0"}}'
```

## 📱 Using the Frontend

1. **Generate by Version**: Enter a specific version tag
2. **Generate Latest**: Automatically detect the latest release
3. **Generate by Date Range**: Specify start and end dates
4. **Download Options**: Get output in Markdown, HTML, or JSON
5. **Send to Teams**: Automatically post to your Teams channel

## 🔍 Monitoring and Logs

### Log Files
- `logs/combined.log` - All logs
- `logs/error.log` - Error logs only
- `logs/performance.log` - Performance metrics
- `logs/mvp.log` - MVP-specific operations

### Health Checks
```bash
# Backend health
curl http://localhost:3001/health

# Release Notes Composer health
curl http://localhost:3001/api/v1/release-notes/health
```

## 🚨 Troubleshooting

### Common Issues

**1. "Configuration incomplete" error**
- Check that all required environment variables are set
- Verify API tokens are valid and have correct permissions

**2. "GitHub connection failed"**
- Verify `GITHUB_TOKEN` has correct scopes (`repo`, `read:org`)
- Check that `GITHUB_ORG` and `GITHUB_REPO` are correct

**3. "JIRA connection failed"**
- Verify `JIRA_HOST` format (should include `https://`)
- Check that `JIRA_USERNAME` and `JIRA_API_TOKEN` are correct

**4. "OpenAI connection failed"**
- Verify `OPENAI_API_KEY` is valid
- Check your OpenAI account has credits

### Debug Mode
```bash
# Enable debug logging
APP_DEBUG=true npm run server

# Check logs in real-time
tail -f logs/combined.log
```

## 🔄 Next Steps

Once you have the Release Notes Composer working:

1. **Set up GitHub Webhooks** for automatic triggering
2. **Customize the AI prompts** for your specific needs
3. **Integrate with your CI/CD pipeline**
4. **Add custom risk assessment rules**
5. **Implement multi-language support**

## 📚 API Reference

### Endpoints

- `POST /api/v1/release-notes/generate` - Generate release notes for a version
- `POST /api/v1/release-notes/generate-latest` - Generate for latest release
- `POST /api/v1/release-notes/generate-date-range` - Generate for date range
- `POST /api/v1/release-notes/preview` - Preview release notes
- `POST /api/v1/release-notes/send-to-teams` - Send to Teams
- `GET /api/v1/release-notes/health` - Health check
- `POST /api/v1/webhooks/github` - GitHub webhook handler

### Request Examples

See the [API Documentation](./docs/API.md) for detailed examples and response formats.

## 🆘 Need Help?

- Check the logs in the `logs/` directory
- Verify your environment configuration
- Test individual integrations separately
- Review the [README.md](./README.md) for more details

---

**🎉 Congratulations!** You now have a fully functional AI-powered Release Notes Composer that automatically generates professional release notes from your development workflow.
