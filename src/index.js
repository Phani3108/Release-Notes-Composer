import 'dotenv/config';
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { releaseNotesRouter } from "./routes/releaseNotes.js";
import { incidentRouter } from "./routes/incidents.js";
import { openapiRouter } from "./routes/openapi.js";
import { costsRouter } from "./routes/costs.js";
import { agentAuditorRouter } from "./routes/agentAuditor.js";
import { ticketSentinelRouter } from "./routes/ticketSentinel.js";
import { releaseRiskRouter } from "./routes/releaseRisk.js";
import { buildVsBuyRouter } from "./routes/buildVsBuy.js";
import { productionRouter } from "./routes/production.js";
import { createProductionMiddleware, getEnvironmentConfig } from "./modules/production.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize production middleware
const production = createProductionMiddleware();
const config = getEnvironmentConfig();

// Apply production middleware
app.use(production.middleware.timing);
app.use(production.middleware.security);
app.use(production.middleware.rateLimit);

// Mock Data for Phase 5 demonstration
const mockMetrics = {
    errorTimeseries: [
        { ts: 1, errors: 10, requests: 10000 },
        { ts: 2, errors: 5, requests: 10000 },
        { ts: 3, errors: 15, requests: 20000 },
        { ts: 4, errors: 5, requests: 10000 },
        { ts: 5, errors: 1, requests: 10000 }
    ],
    performance: {
        LCP_ms: 2200,
        CLS: 0.07,
        TBT_ms: 180
    },
    featureFlags: [
        {
            name: "newCheckout",
            ramp: [
                { step: 1, pct: 5 },
                { step: 2, pct: 40 },
                { step: 3, pct: 60 }
            ]
        },
        {
            name: "darkMode",
            ramp: [
                { step: 1, pct: 10 },
                { step: 2, pct: 25 },
                { step: 3, pct: 50 }
            ]
        }
    ],
    sloTarget: 99.9,
    perfBudget: { LCP_ms: 2500, CLS: 0.1, TBT_ms: 200 },
    maxFlagStep: 25
};

const mockBuildVsBuyData = {
    build: { cost: 120000, time_weeks: 8, risk: 0.3 },
    buy: { cost: 80000, time_weeks: 2, risk: 0.2 },
    weights: { cost: 0.5, time: 0.3, risk: 0.2 }
};

// Mock GitHub and JIRA data for backward compatibility
const mockGitHubData = [
    {
        pr_number: 123,
        title: 'Add authentication feature',
        merged_at: '2025-08-09T12:00:00Z',
        commits: [
            { sha: 'a1b2c3', message: 'Implement login flow' },
            { sha: 'd4e5f6', message: 'Fix bug in signup flow' }
        ]
    },
    {
        pr_number: 124,
        title: 'Fix payment gateway bug',
        merged_at: '2025-08-10T12:00:00Z',
        commits: [
            { sha: 'g7h8i9', message: 'Fix transaction issue' },
            { sha: 'j0k1l2', message: 'Add logging for payment errors' }
        ]
    }
];

const mockJiraData = {
    "PROJECT-123": {
        key: "PROJECT-123",
        summary: "Authentication bug",
        description: "Fix the login bug",
        status: "In Progress",
        assignee: "John Doe"
    },
    "PROJECT-456": {
        key: "PROJECT-456",
        summary: "Payment gateway issue",
        description: "Fix issues with credit card transactions",
        status: "Done",
        assignee: "Jane Smith"
    }
};

// Utility functions
const classifyFeature = (title) => {
    if (title.includes('authentication')) {
        return 'Authentication Feature';
    }
    if (title.includes('payment')) {
        return 'Payment Gateway';
    }
    return 'Other';
};

const riskTagging = (commits) => {
    return commits.some(commit => commit.message.includes('breaking change'))
        ? 'Risk: Breaking Change'
        : 'Risk: Minor Fix';
};

const generateReleaseNotes = (prData, jiraData) => {
    const feature = classifyFeature(prData.title);
    const risk = riskTagging(prData.commits);

    return `
## Release Notes

### Feature:
- **${feature}**:
    - PR: #${prData.pr_number} - ${prData.title}
    - Commits: ${prData.commits.map(c => c.message).join(', ')}
    - JIRA: ${jiraData.key} - ${jiraData.summary}
    - Status: ${jiraData.status}
    - ${risk}
`;
};

const generateIncidentUpdate = (alert) => {
    return `
## Incident Update: ${alert.alertName}

- **Service Affected**: ${alert.service}
- **Severity**: ${alert.severity}
- **Blast Radius**: ${alert.blastRadius}
- **ETA for Resolution**: ${alert.eta}
- **Description**: ${alert.description}
`;
};

// API routes
app.use("/release-notes", releaseNotesRouter);
app.use("/incidents", incidentRouter);
app.use("/openapi", openapiRouter);
app.use("/costs", costsRouter);
app.use("/agent-auditor", agentAuditorRouter);
app.use("/ticket-sentinel", ticketSentinelRouter);
app.use("/release-risk", releaseRiskRouter);
app.use("/build-vs-buy", buildVsBuyRouter);
app.use("/production", productionRouter);

// SSE (Server-Sent Events)
const clients = new Set();
app.get("/events", (req,res)=>{
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
  });
  res.write("retry: 2000\n\n");
  clients.add(res);
  req.on("close", ()=>clients.delete(res));
});
function logSSE(line){ for (const c of clients) c.write(`data: ${line}\n\n`); }
app.set("sseLog", logSSE);

// Lightweight helper to honor UI toggles (Teams/Graph) without new classes
app.use((req,_res,next)=>{
  req.flags = {
    postTeams: req.headers["x-post-teams"] === "1",
    indexGraph: req.headers["x-index-graph"] === "1",
    showProvenance: req.headers["x-show-provenance"] !== "0"
  };
  next();
});

// Demo helper routes
import { demoRouter } from "./routes/demo.js";
import { apiDiffRouter } from "./routes/apiDiff.js";
import { costRouter } from "./routes/cost.js";
import { agenticRouter } from "./routes/agentic.js";
import { metricsRouter } from "./routes/metrics.js";
import { exportRouter } from "./routes/export.js";
import { teamsRouter } from "./routes/teams.js";
import { configRouter } from "./routes/config.js";
import { extensionRouter } from "./routes/extension.js";
import { auditRouter } from "./routes/audit.js";
import { seedRouter } from "./routes/seed.js";

app.use("/demo", demoRouter);
app.use("/api-diff", apiDiffRouter);
app.use("/cost", costRouter);
app.use("/agentic", agenticRouter);
app.use("/metrics", metricsRouter);
app.use("/export", exportRouter);
app.use("/teams", teamsRouter);
app.use("/config", configRouter);
app.use("/ext", extensionRouter);
app.use("/audit", auditRouter);
app.use("/demo/seed", seedRouter);

// Serve dashboard
app.get("/dashboard", (_req, res) => {
    res.sendFile(path.join(__dirname, "../public/dashboard.html"));
});

// Serve public UI files
app.use("/ui", express.static(path.join(__dirname, "../public")));

// Legacy endpoints for backward compatibility
app.post('/webhook', (req, res) => {
    console.log('Received GitHub Webhook:', req.body);
    
    const prData = mockGitHubData[0];
    const jiraData = mockJiraData['PROJECT-123'];
    const releaseNote = generateReleaseNotes(prData, jiraData);
    
    console.log('Generated Release Notes:', releaseNote);
    res.status(200).send('Release Notes Generated');
});

app.get('/jira', (req, res) => {
    res.json(mockJiraData);
});

app.post('/grafana-alert', (req, res) => {
    const alert = {
        alertName: "Service Down",
        service: "Payment Gateway",
        blastRadius: "High",
        eta: "30 minutes",
        severity: "Critical",
        description: "Payment gateway is down, affecting all payment transactions."
    };

    const incidentUpdate = generateIncidentUpdate(alert);
    console.log('Generated Incident Update:', incidentUpdate);
    res.status(200).send(incidentUpdate);
});

app.get('/mock-data', (req, res) => {
    res.json({
        github: mockGitHubData,
        jira: mockJiraData,
        metrics: mockMetrics,
        buildVsBuy: mockBuildVsBuyData
    });
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        phases: ['Phase 1', 'Phase 2', 'Phase 3', 'Phase 4', 'Phase 5']
    });
});

// Root endpoint with comprehensive server info
app.get('/', (req, res) => {
    res.json({
        message: 'Release Notes Composer + Phase 5: AI Release Risk Manager & Build-vs-Buy Advisor',
        version: '1.0.0',
        status: 'running',
        phases: {
            'Phase 1': 'Release Notes Generation',
            'Phase 2': 'Feature Classification & Risk Tagging',
            'Phase 3': 'Incident Update Generation',
            'Phase 4': 'Agent Auditor & Customer Issue Sentinel',
            'Phase 5': 'AI Release Risk Manager & Build-vs-Buy Advisor'
        },
        endpoints: {
            'GET /': 'Server info and endpoints',
            'GET /health': 'Health check',
            'GET /mock-data': 'View all mock data',
            'POST /webhook': 'GitHub webhook endpoint (mock)',
            'GET /jira': 'JIRA API endpoint (mock)',
            'POST /grafana-alert': 'Grafana alert endpoint (mock)',
            'GET /release-notes/*': 'Release notes endpoints',
            'GET /incidents/*': 'Incident management endpoints',
            'GET /openapi/*': 'OpenAPI diff endpoints',
            'GET /costs/*': 'Cost analysis endpoints',
            'GET /agent-auditor/*': 'Agent auditor endpoints',
            'GET /ticket-sentinel/*': 'Ticket sentinel endpoints',
            'GET /release-risk/*': 'Release risk management endpoints',
            'GET /build-vs-buy/*': 'Build vs Buy analysis endpoints',
            'GET /production/*': 'Production monitoring endpoints'
        },
        features: [
            'Release Notes Generation',
            'Feature Classification',
            'Risk Tagging',
            'Incident Update Generation',
            'Agent Auditing & Hardening',
            'Customer Issue Clustering',
            'AI Release Risk Management',
            'Performance Budget Monitoring',
            'Feature Flag Safety Analysis',
            'Build vs Buy Decision Support',
            'Production Monitoring & Metrics',
            'Enhanced Health Checks',
            'Security Headers',
            'Performance Profiling'
        ],
        mockData: {
            available: ['GitHub PRs', 'JIRA Issues', 'Performance Metrics', 'Feature Flags', 'Build vs Buy Scenarios'],
            description: 'All endpoints use realistic mock data for demonstration purposes'
        }
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;
    console.log(`🚀 Phase 7 Server running on ${baseUrl}`);
    console.log(`📋 Available endpoints:`);
    console.log(`   - GET  / - Server info and endpoints`);
    console.log(`   - GET  /health - Health check`);
    console.log(`   - GET  /mock-data - View all mock data`);
    console.log(`   - POST /webhook - GitHub webhook (mock)`);
    console.log(`   - GET  /jira - JIRA API (mock)`);
    console.log(`   - POST /grafana-alert - Grafana alerts (mock)`);
    console.log(`   - GET  /release-notes/* - Release notes endpoints`);
    console.log(`   - GET  /incidents/* - Incident management`);
    console.log(`   - GET  /openapi/* - OpenAPI diff analysis`);
    console.log(`   - GET  /costs/* - Cost analysis`);
    console.log(`   - GET  /agent-auditor/* - Agent auditor`);
    console.log(`   - GET  /ticket-sentinel/* - Ticket sentinel`);
    console.log(`   - GET  /release-risk/* - Release risk management`);
    console.log(`   - GET  /build-vs-buy/* - Build vs Buy analysis`);
    console.log(`   - GET  /production/* - Production monitoring`);
    console.log(`\n💡 To test webhooks locally, use ngrok: ngrok http ${PORT}`);
    console.log(`\n🎯 Phase 7 Features:`);
    console.log(`   - AI Release Risk Manager with error budget, performance budget, and feature flag monitoring`);
    console.log(`   - Build-vs-Buy Advisor with weighted scoring and detailed analysis`);
    console.log(`   - Production monitoring with metrics, health checks, and performance profiling`);
    console.log(`   - Enhanced security headers and production middleware`);
    console.log(`   - Comprehensive mock data for all scenarios`);
});
