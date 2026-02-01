# 🚀 Release Notes Composer - Phase 1: Local Setup & Core Integrations

## 📋 Overview

This document guides you through **Phase 1** of the Release Notes Composer MVP, which focuses on setting up a local development environment with mock data for GitHub webhooks, JIRA API integration, and basic release notes generation.

## 🎯 Phase 1 Deliverables

- ✅ Local server running GitHub webhook and JIRA mock data integration
- ✅ Release Notes Composer generating mock release notes
- ✅ Basic feature classification and risk tagging implemented
- ✅ Local testing environment with web interface and command-line tools

## 🛠️ Prerequisites

- Node.js (v16 or higher) - [Download here](https://nodejs.org/)
- npm (comes with Node.js)
- Git (for version control)

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Start the Local Server

```bash
# Start the local development server
npm run start:local

# Or for development with auto-restart
npm run start:local:dev
```

You should see output like:
```
🚀 Server listening on port 3000
📋 Available endpoints:
   - POST /webhook - GitHub webhook endpoint (mock)
   - GET  /jira - JIRA API endpoint (mock)
   - GET  /mock-data - View all mock data
   - GET  /health - Health check
   - GET  / - Server info

💡 To test webhooks locally, use ngrok: ngrok http 3000
```

## 🧪 Testing Your Local Server

### Option 1: Web Interface (Recommended for beginners)

1. Open your browser and navigate to `http://localhost:3000/test-webhook.html`
2. Use the interactive buttons to test different endpoints:
   - **Check Server Health** - Verify the server is running
   - **Test PR Webhook** - Simulate a GitHub pull request webhook
   - **Get Mock Data** - View all available mock data
   - **Generate Release Notes** - Manually trigger release notes generation

### Option 2: Command Line Testing

```bash
# Test all endpoints
npm run test:local

# Test specific endpoints
npm run test:local webhook
npm run test:local jira
npm run test:local mock-data
npm run test:local health
```

### Option 3: Manual API Testing

```bash
# Health check
curl http://localhost:3000/health

# Get server info
curl http://localhost:3000/

# Get mock data
curl http://localhost:3000/mock-data

# Test webhook (simulate GitHub event)
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: pull_request" \
  -d '{"action":"closed","pull_request":{"number":123,"title":"Test PR"}}'
```

## 📊 Available Endpoints

| Endpoint | Method | Description | Response |
|----------|--------|-------------|----------|
| `/` | GET | Server information and available endpoints | JSON with server details |
| `/health` | GET | Health check endpoint | `{"status":"OK","timestamp":"..."}` |
| `/webhook` | POST | GitHub webhook simulation | "Release Notes Generated" |
| `/jira` | GET | Mock JIRA API endpoint | Mock JIRA issue data |
| `/mock-data` | GET | View all mock data | Combined GitHub + JIRA mock data |

## 🔍 Understanding the Mock Data

### GitHub PR Data Structure

```javascript
{
  pr_number: 123,
  title: 'Add authentication feature',
  merged_at: '2025-08-09T12:00:00Z',
  commits: [
    { sha: 'a1b2c3', message: 'Implement login flow' },
    { sha: 'd4e5f6', message: 'Fix bug in signup flow' }
  ]
}
```

### JIRA Issue Data Structure

```javascript
{
  "PROJECT-123": {
    key: "PROJECT-123",
    summary: "Authentication bug",
    description: "Fix the login bug",
    status: "In Progress",
    assignee: "John Doe"
  }
}
```

## 🧠 Feature Classification & Risk Tagging

### Feature Classification Logic

The system automatically classifies PRs based on title keywords:
- **Authentication Feature**: Contains "authentication"
- **Payment Gateway**: Contains "payment"
- **Other**: Default classification

### Risk Tagging Logic

Risk assessment based on commit messages:
- **Breaking Change**: Contains "breaking change"
- **Minor Fix**: Default risk level

### Example Output

When you trigger the webhook, you'll see generated release notes like:

```markdown
## Release Notes

### Feature:
- **Authentication Feature**:
    - PR: #123 - Add authentication feature
    - Commits: Implement login flow, Fix bug in signup flow
    - JIRA: PROJECT-123 - Authentication bug
    - Status: In Progress
    - Risk: Minor Fix
```

## 🌐 Testing with ngrok (Optional)

To test real GitHub webhooks locally:

1. **Install ngrok**:
   ```bash
   # macOS (using Homebrew)
   brew install ngrok
   
   # Or download from https://ngrok.com/
   ```

2. **Expose your local server**:
   ```bash
   ngrok http 3000
   ```

3. **Use the ngrok URL** in your GitHub repository webhook settings:
   - Go to your GitHub repo → Settings → Webhooks
   - Add webhook with URL: `https://your-ngrok-id.ngrok.io/webhook`
   - Select events: Pull requests, Pushes, Releases

## 🔧 Customization

### Adding More Mock Data

Edit `index.js` to add more GitHub PRs or JIRA issues:

```javascript
// Add more PRs to mockGitHubData array
const mockGitHubData = [
  // ... existing data ...
  {
    pr_number: 125,
    title: 'Add user dashboard',
    merged_at: '2025-08-11T12:00:00Z',
    commits: [
      { sha: 'm1n2o3', message: 'Create dashboard component' }
    ]
  }
];

// Add more JIRA issues to mockJiraData object
const mockJiraData = {
  // ... existing data ...
  "PROJECT-789": {
    key: "PROJECT-789",
    summary: "User dashboard feature",
    description: "Implement user dashboard with analytics",
    status: "To Do",
    assignee: "Alice Johnson"
  }
};
```

### Extending Feature Classification

Add more classification rules in the `classifyFeature` function:

```javascript
const classifyFeature = (title) => {
  if (title.includes('authentication')) return 'Authentication Feature';
  if (title.includes('payment')) return 'Payment Gateway';
  if (title.includes('dashboard')) return 'User Interface';
  if (title.includes('api')) return 'API Enhancement';
  return 'Other';
};
```

### Enhancing Risk Tagging

Improve risk assessment in the `riskTagging` function:

```javascript
const riskTagging = (commits) => {
  const commitMessages = commits.map(c => c.message.toLowerCase());
  
  if (commitMessages.some(msg => msg.includes('breaking change'))) {
    return 'Risk: Breaking Change';
  }
  if (commitMessages.some(msg => msg.includes('security'))) {
    return 'Risk: Security Update';
  }
  if (commitMessages.some(msg => msg.includes('performance'))) {
    return 'Risk: Performance Impact';
  }
  return 'Risk: Minor Fix';
};
```

## 🐛 Troubleshooting

### Common Issues

1. **Port already in use**:
   ```bash
   # Kill process using port 3000
   lsof -ti:3000 | xargs kill -9
   
   # Or use a different port
   PORT=3001 npm run start:local
   ```

2. **Dependencies not found**:
   ```bash
   # Clear npm cache and reinstall
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Server not responding**:
   - Check if the server is running: `npm run start:local`
   - Verify the port: `http://localhost:3000/health`
   - Check console for error messages

### Debug Mode

Enable detailed logging by adding this to your `index.js`:

```javascript
// Add before app.listen()
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  next();
});
```

## 📈 Next Steps

After completing Phase 1, you'll be ready for:

- **Phase 2**: Real GitHub/JIRA API integration
- **Phase 3**: OpenAI GPT integration for enhanced classification
- **Phase 4**: Teams webhook integration
- **Phase 5**: Production deployment

## 🤝 Support

If you encounter issues:

1. Check the console output for error messages
2. Verify all dependencies are installed
3. Ensure the server is running on the correct port
4. Test individual endpoints using the web interface

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [GitHub Webhooks Guide](https://docs.github.com/en/developers/webhooks-and-events/webhooks)
- [JIRA REST API](https://developer.atlassian.com/cloud/jira/platform/rest/v3/)
- [ngrok Documentation](https://ngrok.com/docs)

---

**🎉 Congratulations!** You've successfully set up the Release Notes Composer MVP Phase 1. You now have a working local development environment with mock data integration, feature classification, risk tagging, and release notes generation.
