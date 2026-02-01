const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Mock Data
const mockGitHubData = [
    {
        pr_number: 123,
        title: 'Add authentication feature',
        merged_at: '2025-01-09T12:00:00Z',
        commits: [
            { sha: 'a1b2c3', message: 'Implement login flow' },
            { sha: 'd4e5f6', message: 'Fix bug in signup flow' }
        ],
        author: 'john-doe',
        labels: ['feature', 'authentication']
    },
    {
        pr_number: 124,
        title: 'Fix payment gateway bug',
        merged_at: '2025-01-10T12:00:00Z',
        commits: [
            { sha: 'g7h8i9', message: 'Fix transaction issue' },
            { sha: 'j0k1l2', message: 'Add logging for payment errors' }
        ],
        author: 'jane-smith',
        labels: ['bug-fix', 'payment']
    },
    {
        pr_number: 125,
        title: 'Update user profile API - breaking change',
        merged_at: '2025-01-11T12:00:00Z',
        commits: [
            { sha: 'm3n4o5', message: 'Refactor user profile endpoint' },
            { sha: 'p6q7r8', message: 'Update API documentation' }
        ],
        author: 'dev-team',
        labels: ['breaking-change', 'api']
    }
];

const mockJiraData = {
    "PROJECT-123": {
        key: "PROJECT-123",
        summary: "Authentication bug",
        description: "Fix the login bug",
        status: "In Progress",
        assignee: "John Doe",
        priority: "High",
        issueType: "Bug"
    },
    "PROJECT-456": {
        key: "PROJECT-456",
        summary: "Payment gateway issue",
        description: "Fix issues with credit card transactions",
        status: "Done",
        assignee: "Jane Smith",
        priority: "Critical",
        issueType: "Bug"
    },
    "PROJECT-789": {
        key: "PROJECT-789",
        summary: "User profile API update",
        description: "Update user profile endpoint with new fields",
        status: "Done",
        assignee: "Dev Team",
        priority: "Medium",
        issueType: "Task"
    }
};

// Utility Functions
const classifyFeature = (title, labels = []) => {
    const titleLower = title.toLowerCase();
    const labelsLower = labels.map(l => l.toLowerCase());
    
    if (titleLower.includes('authentication') || labelsLower.includes('authentication')) {
        return 'Authentication Feature';
    }
    if (titleLower.includes('payment') || labelsLower.includes('payment')) {
        return 'Payment Gateway';
    }
    if (titleLower.includes('api') || labelsLower.includes('api')) {
        return 'API Update';
    }
    if (titleLower.includes('profile') || titleLower.includes('user')) {
        return 'User Management';
    }
    return 'Other';
};

const riskTagging = (commits, labels = []) => {
    const commitMessages = commits.map(c => c.message.toLowerCase()).join(' ');
    const labelsLower = labels.map(l => l.toLowerCase());
    
    if (commitMessages.includes('breaking change') || labelsLower.includes('breaking-change')) {
        return { level: 'High', type: 'Breaking Change', description: 'API changes that may require client updates' };
    }
    if (commitMessages.includes('bug') || labelsLower.includes('bug-fix')) {
        return { level: 'Medium', type: 'Bug Fix', description: 'Resolves existing issues' };
    }
    if (commitMessages.includes('security') || labelsLower.includes('security')) {
        return { level: 'High', type: 'Security Update', description: 'Security-related changes' };
    }
    return { level: 'Low', type: 'Feature', description: 'New functionality added' };
};

const generateReleaseNotes = (prData, jiraData) => {
    const feature = classifyFeature(prData.title, prData.labels);
    const risk = riskTagging(prData.commits, prData.labels);
    
    return {
        version: `v1.${prData.pr_number}`,
        date: prData.merged_at,
        feature: feature,
        risk: risk,
        pr: {
            number: prData.pr_number,
            title: prData.title,
            author: prData.author,
            mergedAt: prData.merged_at
        },
        commits: prData.commits,
        jira: jiraData,
        summary: `Updated ${feature.toLowerCase()} with ${risk.type.toLowerCase()}`,
        markdown: `
## Release Notes - ${feature}

### Summary
${risk.type}: ${prData.title}

### Risk Level: ${risk.level}
**${risk.type}**: ${risk.description}

### Pull Request
- **PR #${prData.pr_number}**: ${prData.title}
- **Author**: ${prData.author}
- **Merged**: ${new Date(prData.merged_at).toLocaleDateString()}

### Commits
${prData.commits.map(c => `- \`${c.sha.substring(0, 7)}\` ${c.message}`).join('\n')}

### JIRA Issue
- **Key**: ${jiraData.key}
- **Summary**: ${jiraData.summary}
- **Status**: ${jiraData.status}
- **Priority**: ${jiraData.priority}
- **Type**: ${jiraData.issueType}

---
*Generated on: ${new Date().toLocaleString()}*
        `.trim()
    };
};

// Routes
app.get('/', (req, res) => {
    res.json({
        message: 'Release Notes Composer - Local Development Server',
        endpoints: {
            webhook: 'POST /webhook - GitHub webhook simulation',
            jira: 'GET /jira/:key - Mock JIRA data',
            generate: 'POST /generate - Generate release notes',
            health: 'GET /health - Server health check'
        }
    });
});

app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Mock GitHub Webhook Endpoint
app.post('/webhook', (req, res) => {
    console.log('📥 Received GitHub Webhook:', {
        event: req.headers['x-github-event'],
        body: req.body
    });
    
    // Simulate processing a PR
    const prData = mockGitHubData[Math.floor(Math.random() * mockGitHubData.length)];
    const jiraKey = `PROJECT-${prData.pr_number}`;
    const jiraData = mockJiraData[jiraKey] || mockJiraData['PROJECT-123'];
    
    console.log('🔄 Processing PR:', prData.title);
    
    // Generate release notes
    const releaseNotes = generateReleaseNotes(prData, jiraData);
    
    console.log('📝 Generated Release Notes:', {
        version: releaseNotes.version,
        feature: releaseNotes.feature,
        risk: releaseNotes.risk.type
    });
    
    res.json({
        success: true,
        message: 'Release notes generated successfully',
        data: releaseNotes
    });
});

// Mock JIRA API Endpoint
app.get('/jira/:key', (req, res) => {
    const key = req.params.key;
    const jiraData = mockJiraData[key];
    
    if (jiraData) {
        res.json(jiraData);
    } else {
        res.status(404).json({
            error: 'JIRA issue not found',
            key: key
        });
    }
});

// Generate Release Notes Endpoint
app.post('/generate', (req, res) => {
    const { prNumber, jiraKey } = req.body;
    
    let prData, jiraData;
    
    if (prNumber) {
        prData = mockGitHubData.find(pr => pr.pr_number === parseInt(prNumber));
    } else {
        prData = mockGitHubData[Math.floor(Math.random() * mockGitHubData.length)];
    }
    
    if (!prData) {
        return res.status(404).json({
            error: 'PR not found',
            prNumber: prNumber
        });
    }
    
    if (jiraKey) {
        jiraData = mockJiraData[jiraKey];
    } else {
        const defaultKey = `PROJECT-${prData.pr_number}`;
        jiraData = mockJiraData[defaultKey] || mockJiraData['PROJECT-123'];
    }
    
    const releaseNotes = generateReleaseNotes(prData, jiraData);
    
    res.json({
        success: true,
        data: releaseNotes
    });
});

// Get All Mock Data
app.get('/mock-data', (req, res) => {
    res.json({
        github: mockGitHubData,
        jira: mockJiraData
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Local Development Server running on http://localhost:${PORT}`);
    console.log(`📋 Available endpoints:`);
    console.log(`   - GET  / - Server info`);
    console.log(`   - GET  /health - Health check`);
    console.log(`   - POST /webhook - GitHub webhook simulation`);
    console.log(`   - GET  /jira/:key - Mock JIRA data`);
    console.log(`   - POST /generate - Generate release notes`);
    console.log(`   - GET  /mock-data - View all mock data`);
    console.log(`\n💡 To test webhooks locally, use ngrok: ngrok http ${PORT}`);
});

module.exports = app;
