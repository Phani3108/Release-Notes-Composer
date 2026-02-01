# Phased Plan with Code - Worldclass SDLC Suite

This document contains the complete, runnable code for all phases of the "Worldclass SDLC Suite".

## Bootstrap Instructions

```bash
# 1. Create project directory
mkdir worldclass-sdlc-suite
cd worldclass-sdlc-suite

# 2. Initialize npm project
npm init -y

# 3. Install dependencies
npm install express dotenv cors helmet express-rate-limit winston axios

# 4. Create .env file from .env.example
cp .env.example .env

# 5. Update Master_file.md and Truth_policy.md with your content
# 6. Run preflight check
node scripts/preflight.js

# 7. Initialize truth lock
node scripts/initTruthLock.js

# 8. Start the application
npm start
```

## Complete Code Structure

### package.json
```json
{
  "name": "worldclass-sdlc-suite",
  "version": "1.0.0",
  "description": "Complete SDLC Suite with AI Integration",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "test": "jest",
    "preflight": "node scripts/preflight.js",
    "lock:truth": "node scripts/initTruthLock.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "dotenv": "^16.3.1",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "express-rate-limit": "^7.1.5",
    "winston": "^3.11.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.1",
    "jest": "^29.7.0"
  }
}
```

### .env.example
```env
# Server Configuration
PORT=3000
NODE_ENV=development

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4

# Azure OpenAI Configuration
AZURE_OPENAI_ENDPOINT=your_azure_endpoint_here
AZURE_OPENAI_API_KEY=your_azure_api_key_here
AZURE_OPENAI_DEPLOYMENT=your_deployment_name_here

# Microsoft Graph Configuration
MICROSOFT_GRAPH_CLIENT_ID=your_client_id_here
MICROSOFT_GRAPH_CLIENT_SECRET=your_client_secret_here
MICROSOFT_GRAPH_TENANT_ID=your_tenant_id_here

# Teams Webhook URL
TEAMS_WEBHOOK_URL=your_teams_webhook_url_here

# JIRA Configuration
JIRA_BASE_URL=your_jira_base_url_here
JIRA_USERNAME=your_jira_username_here
JIRA_API_TOKEN=your_jira_api_token_here

# GitHub Configuration
GITHUB_TOKEN=your_github_token_here
GITHUB_WEBHOOK_SECRET=your_webhook_secret_here

# Grafana Configuration
GRAFANA_BASE_URL=your_grafana_base_url_here
GRAFANA_API_KEY=your_grafana_api_key_here

# Security Configuration
JWT_SECRET=your_jwt_secret_here
ENCRYPTION_KEY=your_encryption_key_here

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FILE_PATH=logs/app.log

# Database (if using)
DATABASE_URL=your_database_url_here

# Monitoring
PROMETHEUS_ENDPOINT=your_prometheus_endpoint_here
JAEGER_ENDPOINT=your_jaeger_endpoint_here
```

### Master_file.md (Placeholder)
```markdown
# Master Project Instructions

This is a placeholder for your actual Master_file.md content.
Please replace this with your real project instructions.

## Project Overview
- Phase 1: Release Notes Composer
- Phase 2: Incident Bot
- Phase 3: API Gatekeeper
- Phase 4: Cost Drift & Agent Auditor
- Phase 5: AI Release Risk Manager
- Phase 6: Truth Policy & Security
- Phase 7: Production Monitoring

## Development Guidelines
1. Follow the phased approach
2. Implement comprehensive testing
3. Ensure security best practices
4. Document all changes
5. Maintain truth policy compliance
```

### Truth_policy.md (Placeholder)
```markdown
# Truth Policy

This is a placeholder for your actual Truth_policy.md content.
Please replace this with your real truth policy.

## Core Principles
1. Data integrity and accuracy
2. Transparent decision-making
3. Ethical AI usage
4. Security-first approach
5. Compliance with regulations

## Implementation Guidelines
- All AI outputs must be validated
- Security measures must be comprehensive
- Testing must be thorough
- Documentation must be complete
```

### scripts/preflight.js
```javascript
#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.join(__dirname, '..');

function calculateFileHash(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        return crypto.createHash('sha256').update(content).digest('hex');
    } catch (error) {
        console.error(`Error reading file ${filePath}:`, error.message);
        return null;
    }
}

function checkTruthLock() {
    const masterFile = path.join(PROJECT_ROOT, 'Master_file.md');
    const truthPolicy = path.join(PROJECT_ROOT, 'Truth_policy.md');
    const truthLock = path.join(PROJECT_ROOT, 'docs', '.truth_lock.json');

    if (!fs.existsSync(masterFile)) {
        console.error('[PRE-FLIGHT] Master_file.md not found!');
        process.exit(1);
    }

    if (!fs.existsSync(truthPolicy)) {
        console.error('[PRE-FLIGHT] Truth_policy.md not found!');
        process.exit(1);
    }

    if (!fs.existsSync(truthLock)) {
        console.error('[PRE-FLIGHT] Truth lock not found! Run: npm run lock:truth');
        process.exit(1);
    }

    try {
        const lockData = JSON.parse(fs.readFileSync(truthLock, 'utf8'));
        const currentMasterHash = calculateFileHash(masterFile);
        const currentTruthHash = calculateFileHash(truthPolicy);

        if (lockData.master_file_hash !== currentMasterHash || 
            lockData.truth_policy_hash !== currentTruthHash) {
            console.error('[PRE-FLIGHT] Master_file.md or Truth_policy.md changed! Update lock or revert.');
            process.exit(1);
        }

        console.log('✅ Truth lock validation passed');
    } catch (error) {
        console.error('[PRE-FLIGHT] Error reading truth lock:', error.message);
        process.exit(1);
    }
}

function checkSourceCode() {
    const srcDir = path.join(PROJECT_ROOT, 'src');
    const scriptsDir = path.join(PROJECT_ROOT, 'scripts');

    function checkDirectory(dirPath, dirName) {
        if (!fs.existsSync(dirPath)) return;

        const files = fs.readdirSync(dirPath, { recursive: true });
        for (const file of files) {
            if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.ts') || file.endsWith('.tsx')) {
                const fullPath = path.join(dirPath, file);
                try {
                    const content = fs.readFileSync(fullPath, 'utf8');
                    if (content.trim() === '') {
                        console.warn(`⚠️  Empty file: ${fullPath}`);
                    }
                    if (content.includes('TODO') || content.includes('FIXME')) {
                        console.warn(`⚠️  TODO/FIXME found in: ${fullPath}`);
                    }
                } catch (error) {
                    console.warn(`⚠️  Could not read: ${fullPath}`);
                }
            }
        }
    }

    checkDirectory(srcDir, 'src');
    checkDirectory(scriptsDir, 'scripts');
}

function main() {
    console.log('🔍 Running pre-flight checks...');
    
    checkTruthLock();
    checkSourceCode();
    
    console.log('✅ All pre-flight checks passed!');
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}
```

### scripts/initTruthLock.js
```javascript
#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.join(__dirname, '..');

function calculateFileHash(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        return crypto.createHash('sha256').update(content).digest('hex');
    } catch (error) {
        console.error(`Error reading file ${filePath}:`, error.message);
        return null;
    }
}

function createTruthLock() {
    const masterFile = path.join(PROJECT_ROOT, 'Master_file.md');
    const truthPolicy = path.join(PROJECT_ROOT, 'Truth_policy.md');
    const docsDir = path.join(PROJECT_ROOT, 'docs');
    const truthLockPath = path.join(docsDir, '.truth_lock.json');

    if (!fs.existsSync(masterFile)) {
        console.error('Master_file.md not found!');
        process.exit(1);
    }

    if (!fs.existsSync(truthPolicy)) {
        console.error('Truth_policy.md not found!');
        process.exit(1);
    }

    // Create docs directory if it doesn't exist
    if (!fs.existsSync(docsDir)) {
        fs.mkdirSync(docsDir, { recursive: true });
    }

    const masterHash = calculateFileHash(masterFile);
    const truthHash = calculateFileHash(truthPolicy);

    if (!masterHash || !truthHash) {
        console.error('Failed to calculate file hashes!');
        process.exit(1);
    }

    const lockData = {
        created_at: new Date().toISOString(),
        master_file_hash: masterHash,
        truth_policy_hash: truthHash,
        version: '1.0.0'
    };

    try {
        fs.writeFileSync(truthLockPath, JSON.stringify(lockData, null, 2));
        console.log('✅ Truth lock created successfully!');
        console.log(`📁 Location: ${truthLockPath}`);
        console.log(`🔒 Master file hash: ${masterHash.substring(0, 8)}...`);
        console.log(`🔒 Truth policy hash: ${truthHash.substring(0, 8)}...`);
    } catch (error) {
        console.error('Failed to create truth lock:', error.message);
        process.exit(1);
    }
}

function main() {
    console.log('🔒 Initializing truth lock...');
    createTruthLock();
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}
```

### src/index.js
```javascript
import 'dotenv/config';
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { createProductionMiddleware, getEnvironmentConfig } from "./modules/production.js";
import { releaseNotesRouter } from "./routes/releaseNotes.js";
import { incidentRouter } from "./routes/incidents.js";
import { openapiRouter } from "./routes/openapi.js";
import { costsRouter } from "./routes/costs.js";
import { agentAuditorRouter } from "./routes/agentAuditor.js";
import { ticketSentinelRouter } from "./routes/ticketSentinel.js";
import { releaseRiskRouter } from "./routes/releaseRisk.js";
import { buildVsBuyRouter } from "./routes/buildVsBuy.js";
import { productionRouter } from "./routes/production.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize production middleware
const production = createProductionMiddleware();
const config = getEnvironmentConfig();

// Apply production middleware
app.use(production.middleware.timing);
app.use(production.middleware.security);
app.use(production.middleware.rateLimit);

// Basic middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
    });
});

// API routes
app.use('/api/release-notes', releaseNotesRouter);
app.use('/api/incidents', incidentRouter);
app.use('/api/openapi', openapiRouter);
app.use('/api/costs', costsRouter);
app.use('/api/agent-auditor', agentAuditorRouter);
app.use('/api/ticket-sentinel', ticketSentinelRouter);
app.use('/api/release-risk', releaseRiskRouter);
app.use('/api/build-vs-buy', buildVsBuyRouter);
app.use('/api/production', productionRouter);

// Production monitoring endpoint
app.get('/api/production/status', (req, res) => {
    res.json({
        status: 'operational',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        environment: config.environment,
        timestamp: new Date().toISOString()
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: 'The requested resource was not found'
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Worldclass SDLC Suite running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`📈 Production status: http://localhost:${PORT}/api/production/status`);
});

export default app;
```

### src/modules/production.js
```javascript
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

export function createProductionMiddleware() {
    const rateLimiter = rateLimit({
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
        max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
        message: {
            error: 'Too many requests from this IP, please try again later.',
            retryAfter: Math.ceil(parseInt(process.env.RATE_LIMIT_WINDOW_MS) / 1000 / 60)
        },
        standardHeaders: true,
        legacyHeaders: false,
    });

    const securityMiddleware = helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", "data:", "https:"],
            },
        },
        hsts: {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true
        }
    });

    const timingMiddleware = (req, res, next) => {
        const start = Date.now();
        res.on('finish', () => {
            const duration = Date.now() - start;
            console.log(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
        });
        next();
    };

    return {
        middleware: {
            rateLimit: rateLimiter,
            security: securityMiddleware,
            timing: timingMiddleware
        }
    };
}

export function getEnvironmentConfig() {
    return {
        environment: process.env.NODE_ENV || 'development',
        port: process.env.PORT || 3000,
        isProduction: process.env.NODE_ENV === 'production',
        isDevelopment: process.env.NODE_ENV === 'development'
    };
}
```

### src/modules/releaseNotes.js
```javascript
import { openaiClient } from '../openai/client.js';

export function generateReleaseNotes(prs, jiraTickets, options = {}) {
    const {
        format = 'markdown',
        includePRs = true,
        includeJIRA = true,
        aiEnhancement = true
    } = options;

    let releaseNotes = '';

    if (includePRs && prs && prs.length > 0) {
        releaseNotes += '# Pull Requests\n\n';
        prs.forEach(pr => {
            releaseNotes += `## ${pr.title}\n`;
            releaseNotes += `- **Author:** ${pr.author}\n`;
            releaseNotes += `- **Merged:** ${pr.merged_at}\n`;
            releaseNotes += `- **Description:** ${pr.description || 'No description provided'}\n\n`;
        });
    }

    if (includeJIRA && jiraTickets && jiraTickets.length > 0) {
        releaseNotes += '# JIRA Tickets\n\n';
        jiraTickets.forEach(ticket => {
            releaseNotes += `## ${ticket.summary}\n`;
            releaseNotes += `- **Key:** ${ticket.key}\n`;
            releaseNotes += `- **Type:** ${ticket.issueType}\n`;
            releaseNotes += `- **Status:** ${ticket.status}\n`;
            releaseNotes += `- **Description:** ${ticket.description || 'No description provided'}\n\n`;
        });
    }

    if (aiEnhancement && (prs?.length > 0 || jiraTickets?.length > 0)) {
        try {
            const enhancedNotes = enhanceWithAI(releaseNotes);
            releaseNotes = enhancedNotes;
        } catch (error) {
            console.warn('AI enhancement failed, using original notes:', error.message);
        }
    }

    return releaseNotes;
}

async function enhanceWithAI(notes) {
    const prompt = `Please enhance the following release notes to be more professional and user-friendly. 
    Make them concise, clear, and highlight the most important changes. 
    Keep the same structure but improve the language and organization:
    
    ${notes}`;

    try {
        const response = await openaiClient.chat.completions.create({
            model: process.env.OPENAI_MODEL || 'gpt-4',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 1000,
            temperature: 0.7
        });

        return response.choices[0].message.content;
    } catch (error) {
        console.error('OpenAI API error:', error);
        return notes; // Return original notes if AI enhancement fails
    }
}

export function loadJSON(filePath) {
    try {
        const fs = await import('fs');
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error loading JSON file ${filePath}:`, error);
        return [];
    }
}

export function generateMarkdown(prs, jiraTickets) {
    return generateReleaseNotes(prs, jiraTickets, { format: 'markdown' });
}
```

### src/modules/incidents.js
```javascript
import { openaiClient } from '../openai/client.js';

export class IncidentBot {
    constructor() {
        this.incidents = [];
        this.severityLevels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    }

    async createIncident(data) {
        const incident = {
            id: this.generateIncidentId(),
            title: data.title,
            description: data.description,
            severity: data.severity || 'MEDIUM',
            status: 'OPEN',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            assignee: data.assignee || null,
            priority: this.calculatePriority(data.severity),
            estimated_resolution_time: this.estimateResolutionTime(data.severity),
            tags: data.tags || []
        };

        // AI-powered incident analysis
        try {
            const aiAnalysis = await this.analyzeIncident(incident);
            incident.ai_analysis = aiAnalysis;
            incident.recommended_actions = aiAnalysis.recommended_actions;
        } catch (error) {
            console.warn('AI analysis failed:', error.message);
            incident.ai_analysis = { error: 'AI analysis unavailable' };
        }

        this.incidents.push(incident);
        return incident;
    }

    async analyzeIncident(incident) {
        const prompt = `Analyze this incident and provide:
        1. Risk assessment (1-10 scale)
        2. Recommended immediate actions
        3. Potential impact on users
        4. Suggested escalation path
        5. Related documentation or runbooks
        
        Incident: ${incident.title}
        Description: ${incident.description}
        Severity: ${incident.severity}`;

        try {
            const response = await openaiClient.chat.completions.create({
                model: process.env.OPENAI_MODEL || 'gpt-4',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 500,
                temperature: 0.3
            });

            const analysis = response.choices[0].message.content;
            
            return {
                risk_score: this.extractRiskScore(analysis),
                recommended_actions: this.extractActions(analysis),
                impact_assessment: this.extractImpact(analysis),
                escalation_path: this.extractEscalation(analysis),
                raw_analysis: analysis
            };
        } catch (error) {
            throw new Error(`AI analysis failed: ${error.message}`);
        }
    }

    extractRiskScore(analysis) {
        const riskMatch = analysis.match(/risk.*?(\d+)/i);
        return riskMatch ? parseInt(riskMatch[1]) : 5;
    }

    extractActions(analysis) {
        const actionMatch = analysis.match(/recommended.*?actions?:(.*?)(?=\n|$)/is);
        return actionMatch ? actionMatch[1].trim() : 'Review incident details';
    }

    extractImpact(analysis) {
        const impactMatch = analysis.match(/impact.*?:(.*?)(?=\n|$)/is);
        return impactMatch ? impactMatch[1].trim() : 'Impact assessment needed';
    }

    extractEscalation(analysis) {
        const escalationMatch = analysis.match(/escalation.*?:(.*?)(?=\n|$)/is);
        return escalationMatch ? escalationMatch[1].trim() : 'Follow standard escalation procedures';
    }

    calculatePriority(severity) {
        const priorityMap = {
            'CRITICAL': 1,
            'HIGH': 2,
            'MEDIUM': 3,
            'LOW': 4
        };
        return priorityMap[severity] || 3;
    }

    estimateResolutionTime(severity) {
        const timeMap = {
            'CRITICAL': '2-4 hours',
            'HIGH': '4-8 hours',
            'MEDIUM': '1-2 days',
            'LOW': '3-5 days'
        };
        return timeMap[severity] || '1-2 days';
    }

    generateIncidentId() {
        return `INC-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    }

    getIncidents(filters = {}) {
        let filtered = [...this.incidents];

        if (filters.severity) {
            filtered = filtered.filter(inc => inc.severity === filters.severity);
        }

        if (filters.status) {
            filtered = filtered.filter(inc => inc.status === filters.status);
        }

        if (filters.assignee) {
            filtered = filtered.filter(inc => inc.assignee === filters.assignee);
        }

        return filtered.sort((a, b) => a.priority - b.priority);
    }

    updateIncident(id, updates) {
        const incident = this.incidents.find(inc => inc.id === id);
        if (!incident) {
            throw new Error('Incident not found');
        }

        Object.assign(incident, updates, { updated_at: new Date().toISOString() });
        return incident;
    }

    closeIncident(id, resolution) {
        const incident = this.updateIncident(id, {
            status: 'CLOSED',
            resolution: resolution,
            closed_at: new Date().toISOString()
        });
        return incident;
    }
}
```

### src/modules/openapiDiff.js
```javascript
import { openaiClient } from '../openai/client.js';

export class APIGatekeeper {
    constructor() {
        this.changes = [];
        this.riskThreshold = 7; // Risk score threshold for blocking changes
    }

    async analyzeAPIDiff(beforeSpec, afterSpec) {
        const changes = this.extractChanges(beforeSpec, afterSpec);
        const analysis = await this.analyzeChanges(changes);
        
        const result = {
            changes: changes,
            risk_assessment: analysis.risk_assessment,
            breaking_changes: analysis.breaking_changes,
            recommendations: analysis.recommendations,
            approval_required: analysis.risk_score >= this.riskThreshold,
            timestamp: new Date().toISOString()
        };

        this.changes.push(result);
        return result;
    }

    extractChanges(beforeSpec, afterSpec) {
        const changes = {
            endpoints_added: [],
            endpoints_removed: [],
            endpoints_modified: [],
            schemas_added: [],
            schemas_removed: [],
            schemas_modified: []
        };

        // Compare endpoints
        const beforeEndpoints = this.extractEndpoints(beforeSpec);
        const afterEndpoints = this.extractEndpoints(afterSpec);

        // Find added endpoints
        afterEndpoints.forEach(endpoint => {
            if (!beforeEndpoints.find(b => this.endpointKey(b) === this.endpointKey(endpoint))) {
                changes.endpoints_added.push(endpoint);
            }
        });

        // Find removed endpoints
        beforeEndpoints.forEach(endpoint => {
            if (!afterEndpoints.find(a => this.endpointKey(a) === this.endpointKey(endpoint))) {
                changes.endpoints_removed.push(endpoint);
            }
        });

        // Find modified endpoints
        beforeEndpoints.forEach(beforeEndpoint => {
            const afterEndpoint = afterEndpoints.find(a => this.endpointKey(a) === this.endpointKey(beforeEndpoint));
            if (afterEndpoint && this.hasEndpointChanged(beforeEndpoint, afterEndpoint)) {
                changes.endpoints_modified.push({
                    before: beforeEndpoint,
                    after: afterEndpoint,
                    changes: this.getEndpointChanges(beforeEndpoint, afterEndpoint)
                });
            }
        });

        return changes;
    }

    extractEndpoints(spec) {
        const endpoints = [];
        
        if (spec.paths) {
            Object.entries(spec.paths).forEach(([path, methods]) => {
                Object.entries(methods).forEach(([method, details]) => {
                    if (method !== 'parameters') {
                        endpoints.push({
                            path: path,
                            method: method.toUpperCase(),
                            summary: details.summary || '',
                            parameters: details.parameters || [],
                            responses: details.responses || {},
                            tags: details.tags || []
                        });
                    }
                });
            });
        }

        return endpoints;
    }

    endpointKey(endpoint) {
        return `${endpoint.method}:${endpoint.path}`;
    }

    hasEndpointChanged(before, after) {
        return JSON.stringify(before) !== JSON.stringify(after);
    }

    getEndpointChanges(before, after) {
        const changes = [];
        
        if (before.summary !== after.summary) {
            changes.push(`Summary changed from "${before.summary}" to "${after.summary}"`);
        }

        if (JSON.stringify(before.parameters) !== JSON.stringify(after.parameters)) {
            changes.push('Parameters modified');
        }

        if (JSON.stringify(before.responses) !== JSON.stringify(after.responses)) {
            changes.push('Response schema modified');
        }

        return changes;
    }

    async analyzeChanges(changes) {
        const prompt = `Analyze these API changes and provide:
        1. Risk assessment (1-10 scale)
        2. Breaking change identification
        3. Impact analysis
        4. Recommendations for safe deployment
        
        Changes:
        - Endpoints added: ${changes.endpoints_added.length}
        - Endpoints removed: ${changes.endpoints_removed.length}
        - Endpoints modified: ${changes.endpoints_modified.length}
        - Schemas added: ${changes.schemas_added.length}
        - Schemas removed: ${changes.schemas_removed.length}
        - Schemas modified: ${changes.schemas_modified.length}`;

        try {
            const response = await openaiClient.chat.completions.create({
                model: process.env.OPENAI_MODEL || 'gpt-4',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 600,
                temperature: 0.3
            });

            const analysis = response.choices[0].message.content;
            
            return {
                risk_score: this.extractRiskScore(analysis),
                risk_assessment: analysis,
                breaking_changes: this.extractBreakingChanges(analysis),
                recommendations: this.extractRecommendations(analysis)
            };
        } catch (error) {
            console.error('AI analysis failed:', error);
            return {
                risk_score: 5,
                risk_assessment: 'AI analysis unavailable',
                breaking_changes: 'Unable to determine',
                recommendations: 'Manual review required'
            };
        }
    }

    extractRiskScore(analysis) {
        const riskMatch = analysis.match(/risk.*?(\d+)/i);
        return riskMatch ? parseInt(riskMatch[1]) : 5;
    }

    extractBreakingChanges(analysis) {
        const breakingMatch = analysis.match(/breaking.*?changes?:(.*?)(?=\n|$)/is);
        return breakingMatch ? breakingMatch[1].trim() : 'Manual review required';
    }

    extractRecommendations(analysis) {
        const recMatch = analysis.match(/recommendations?:(.*?)(?=\n|$)/is);
        return recMatch ? recMatch[1].trim() : 'Follow standard deployment procedures';
    }

    getChangeHistory(filters = {}) {
        let filtered = [...this.changes];

        if (filters.approval_required !== undefined) {
            filtered = filtered.filter(change => change.approval_required === filters.approval_required);
        }

        if (filters.risk_threshold) {
            filtered = filtered.filter(change => change.risk_assessment.risk_score >= filters.risk_threshold);
        }

        return filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    approveChange(changeId, approver, comments) {
        const change = this.changes.find(c => c.timestamp === changeId);
        if (!change) {
            throw new Error('Change not found');
        }

        change.approved = true;
        change.approver = approver;
        change.approval_comments = comments;
        change.approved_at = new Date().toISOString();

        return change;
    }
}
```

### src/modules/costDrift.js
```javascript
import { openaiClient } from '../openai/client.js';

export class CostDriftAnalyzer {
    constructor() {
        this.costHistory = [];
        this.thresholds = {
            warning: 0.1, // 10% increase
            critical: 0.25 // 25% increase
        };
    }

    async analyzeCostDrift(currentCosts, historicalCosts) {
        const driftAnalysis = this.calculateDrift(currentCosts, historicalCosts);
        const aiInsights = await this.getAIInsights(driftAnalysis);
        
        const result = {
            ...driftAnalysis,
            ai_insights: aiInsights,
            timestamp: new Date().toISOString(),
            recommendations: aiInsights.recommendations
        };

        this.costHistory.push(result);
        return result;
    }

    calculateDrift(currentCosts, historicalCosts) {
        const drift = {};
        const totalCurrent = Object.values(currentCosts).reduce((sum, cost) => sum + cost, 0);
        const totalHistorical = Object.values(historicalCosts).reduce((sum, cost) => sum + cost, 0);

        // Overall drift
        const overallDrift = (totalCurrent - totalHistorical) / totalHistorical;
        drift.overall = {
            percentage: overallDrift * 100,
            absolute: totalCurrent - totalHistorical,
            severity: this.getSeverity(overallDrift)
        };

        // Per-service drift
        drift.services = {};
        Object.keys(currentCosts).forEach(service => {
            const current = currentCosts[service] || 0;
            const historical = historicalCosts[service] || 0;
            
            if (historical > 0) {
                const serviceDrift = (current - historical) / historical;
                drift.services[service] = {
                    percentage: serviceDrift * 100,
                    absolute: current - historical,
                    severity: this.getSeverity(serviceDrift)
                };
            } else if (current > 0) {
                drift.services[service] = {
                    percentage: Infinity,
                    absolute: current,
                    severity: 'CRITICAL'
                };
            }
        });

        return drift;
    }

    getSeverity(driftPercentage) {
        if (Math.abs(driftPercentage) <= this.thresholds.warning) {
            return 'LOW';
        } else if (Math.abs(driftPercentage) <= this.thresholds.critical) {
            return 'WARNING';
        } else {
            return 'CRITICAL';
        }
    }

    async getAIInsights(driftAnalysis) {
        const prompt = `Analyze this cost drift data and provide:
        1. Root cause analysis
        2. Cost optimization recommendations
        3. Risk assessment
        4. Immediate actions to take
        
        Overall drift: ${driftAnalysis.overall.percentage.toFixed(2)}%
        Severity: ${driftAnalysis.overall.severity}
        
        Service-level changes:
        ${Object.entries(driftAnalysis.services).map(([service, data]) => 
            `${service}: ${data.percentage.toFixed(2)}% (${data.severity})`
        ).join('\n')}`;

        try {
            const response = await openaiClient.chat.completions.create({
                model: process.env.OPENAI_MODEL || 'gpt-4',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 500,
                temperature: 0.3
            });

            const analysis = response.choices[0].message.content;
            
            return {
                root_cause: this.extractRootCause(analysis),
                recommendations: this.extractRecommendations(analysis),
                risk_assessment: this.extractRiskAssessment(analysis),
                immediate_actions: this.extractImmediateActions(analysis),
                raw_analysis: analysis
            };
        } catch (error) {
            console.error('AI analysis failed:', error);
            return {
                root_cause: 'Unable to determine',
                recommendations: 'Manual review required',
                risk_assessment: 'Medium risk',
                immediate_actions: 'Review cost data manually'
            };
        }
    }

    extractRootCause(analysis) {
        const causeMatch = analysis.match(/root cause:(.*?)(?=\n|$)/is);
        return causeMatch ? causeMatch[1].trim() : 'Manual investigation required';
    }

    extractRecommendations(analysis) {
        const recMatch = analysis.match(/recommendations?:(.*?)(?=\n|$)/is);
        return recMatch ? recMatch[1].trim() : 'Review cost optimization strategies';
    }

    extractRiskAssessment(analysis) {
        const riskMatch = analysis.match(/risk assessment:(.*?)(?=\n|$)/is);
        return riskMatch ? riskMatch[1].trim() : 'Medium risk level';
    }

    extractImmediateActions(analysis) {
        const actionMatch = analysis.match(/immediate actions?:(.*?)(?=\n|$)/is);
        return actionMatch ? actionMatch[1].trim() : 'Schedule cost review meeting';
    }

    getCostHistory(filters = {}) {
        let filtered = [...this.costHistory];

        if (filters.severity) {
            filtered = filtered.filter(entry => entry.overall.severity === filters.severity);
        }

        if (filters.dateRange) {
            const startDate = new Date(filters.dateRange.start);
            const endDate = new Date(filters.dateRange.end);
            filtered = filtered.filter(entry => {
                const entryDate = new Date(entry.timestamp);
                return entryDate >= startDate && entryDate <= endDate;
            });
        }

        return filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    setThresholds(warning, critical) {
        this.thresholds.warning = warning;
        this.thresholds.critical = critical;
    }

    generateReport(filters = {}) {
        const history = this.getCostHistory(filters);
        const totalDrift = history.reduce((sum, entry) => sum + entry.overall.absolute, 0);
        const averageDrift = totalDrift / history.length;

        return {
            summary: {
                total_entries: history.length,
                total_drift: totalDrift,
                average_drift: averageDrift,
                critical_incidents: history.filter(entry => entry.overall.severity === 'CRITICAL').length
            },
            details: history,
            generated_at: new Date().toISOString()
        };
    }
}
```

### src/modules/agentAuditor.js
```javascript
import { openaiClient } from '../openai/client.js';

export class AgentAuditor {
    constructor() {
        this.auditHistory = [];
        this.auditSpecs = new Map();
        this.complianceRules = new Map();
    }

    async auditAgent(agentSpec, agentOutput, context = {}) {
        const audit = {
            id: this.generateAuditId(),
            agent_id: agentSpec.id || 'unknown',
            timestamp: new Date().toISOString(),
            spec: agentSpec,
            output: agentOutput,
            context: context,
            compliance_score: 0,
            violations: [],
            recommendations: [],
            risk_assessment: 'LOW'
        };

        // Run compliance checks
        const complianceResult = await this.checkCompliance(agentSpec, agentOutput);
        audit.compliance_score = complianceResult.score;
        audit.violations = complianceResult.violations;
        audit.recommendations = complianceResult.recommendations;

        // Run risk assessment
        const riskResult = await this.assessRisk(agentSpec, agentOutput, complianceResult);
        audit.risk_assessment = riskResult.level;
        audit.risk_details = riskResult.details;

        // AI-powered analysis
        const aiAnalysis = await this.getAIAnalysis(audit);
        audit.ai_analysis = aiAnalysis;

        this.auditHistory.push(audit);
        return audit;
    }

    async checkCompliance(agentSpec, agentOutput) {
        const violations = [];
        let score = 100;

        // Check required fields
        if (agentSpec.required_fields) {
            agentSpec.required_fields.forEach(field => {
                if (!agentOutput[field]) {
                    violations.push(`Missing required field: ${field}`);
                    score -= 10;
                }
            });
        }

        // Check data format compliance
        if (agentSpec.data_formats) {
            Object.entries(agentSpec.data_formats).forEach(([field, format]) => {
                const value = agentOutput[field];
                if (value && !this.validateFormat(value, format)) {
                    violations.push(`Invalid format for field: ${field}`);
                    score -= 5;
                }
            });
        }

        // Check business rules
        if (agentSpec.business_rules) {
            const ruleViolations = await this.checkBusinessRules(agentSpec.business_rules, agentOutput);
            violations.push(...ruleViolations);
            score -= ruleViolations.length * 5;
        }

        // Ensure score doesn't go below 0
        score = Math.max(0, score);

        return {
            score: score,
            violations: violations,
            recommendations: this.generateComplianceRecommendations(violations)
        };
    }

    validateFormat(value, format) {
        switch (format) {
            case 'email':
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
            case 'url':
                return /^https?:\/\/.+/.test(value);
            case 'date':
                return !isNaN(Date.parse(value));
            case 'number':
                return !isNaN(parseFloat(value));
            case 'boolean':
                return typeof value === 'boolean' || ['true', 'false', '0', '1'].includes(String(value).toLowerCase());
            default:
                return true;
        }
    }

    async checkBusinessRules(rules, output) {
        const violations = [];
        
        for (const rule of rules) {
            try {
                const result = await this.evaluateRule(rule, output);
                if (!result.compliant) {
                    violations.push(rule.description || `Rule violation: ${rule.condition}`);
                }
            } catch (error) {
                console.warn(`Error evaluating business rule: ${error.message}`);
            }
        }

        return violations;
    }

    async evaluateRule(rule, output) {
        // Simple rule evaluation - in production, you might use a rules engine
        if (rule.condition === 'max_value' && rule.field && rule.max_value) {
            const value = parseFloat(output[rule.field]);
            return {
                compliant: !isNaN(value) && value <= rule.max_value,
                actual_value: value,
                threshold: rule.max_value
            };
        }

        if (rule.condition === 'required_combination' && rule.fields) {
            const hasAllFields = rule.fields.every(field => output[field]);
            return {
                compliant: hasAllFields,
                missing_fields: rule.fields.filter(field => !output[field])
            };
        }

        return { compliant: true };
    }

    generateComplianceRecommendations(violations) {
        const recommendations = [];
        
        violations.forEach(violation => {
            if (violation.includes('Missing required field')) {
                recommendations.push('Ensure all required fields are populated before agent execution');
            } else if (violation.includes('Invalid format')) {
                recommendations.push('Validate data formats according to specification requirements');
            } else if (violation.includes('Rule violation')) {
                recommendations.push('Review and update business rules to align with current requirements');
            }
        });

        return recommendations;
    }

    async assessRisk(agentSpec, agentOutput, complianceResult) {
        let riskLevel = 'LOW';
        let riskDetails = [];

        // High compliance violations indicate higher risk
        if (complianceResult.score < 70) {
            riskLevel = 'HIGH';
            riskDetails.push('Multiple compliance violations detected');
        } else if (complianceResult.score < 90) {
            riskLevel = 'MEDIUM';
            riskDetails.push('Some compliance issues detected');
        }

        // Check for sensitive data exposure
        if (this.containsSensitiveData(agentOutput)) {
            riskLevel = 'HIGH';
            riskDetails.push('Potential sensitive data exposure detected');
        }

        // Check for unusual patterns
        const patternAnalysis = await this.analyzePatterns(agentSpec, agentOutput);
        if (patternAnalysis.anomalies.length > 0) {
            riskLevel = Math.max(riskLevel === 'HIGH' ? 3 : riskLevel === 'MEDIUM' ? 2 : 1, 
                               patternAnalysis.anomalies.length > 2 ? 3 : patternAnalysis.anomalies.length > 1 ? 2 : 1);
            riskDetails.push(`Pattern anomalies detected: ${patternAnalysis.anomalies.length}`);
        }

        return {
            level: this.numericToRiskLevel(riskLevel),
            details: riskDetails,
            pattern_analysis: patternAnalysis
        };
    }

    containsSensitiveData(output) {
        const sensitivePatterns = [
            /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/, // Credit card
            /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
            /\b\d{3}-\d{2}-\d{4}\b/, // SSN
            /\b\d{10,11}\b/ // Phone numbers
        ];

        const outputString = JSON.stringify(output).toLowerCase();
        return sensitivePatterns.some(pattern => pattern.test(outputString));
    }

    async analyzePatterns(agentSpec, agentOutput) {
        const prompt = `Analyze this agent output for unusual patterns or anomalies:
        
        Agent Specification: ${JSON.stringify(agentSpec, null, 2)}
        Agent Output: ${JSON.stringify(agentOutput, null, 2)}
        
        Identify any patterns that seem unusual, unexpected, or potentially problematic.`;

        try {
            const response = await openaiClient.chat.completions.create({
                model: process.env.OPENAI_MODEL || 'gpt-4',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 300,
                temperature: 0.3
            });

            const analysis = response.choices[0].message.content;
            
            return {
                anomalies: this.extractAnomalies(analysis),
                pattern_insights: analysis
            };
        } catch (error) {
            return {
                anomalies: [],
                pattern_insights: 'Pattern analysis unavailable'
            };
        }
    }

    extractAnomalies(analysis) {
        const anomalies = [];
        const lines = analysis.split('\n');
        
        lines.forEach(line => {
            if (line.toLowerCase().includes('anomaly') || line.toLowerCase().includes('unusual') || 
                line.toLowerCase().includes('problematic')) {
                anomalies.push(line.trim());
            }
        });

        return anomalies;
    }

    numericToRiskLevel(level) {
        if (typeof level === 'number') {
            if (level === 3) return 'HIGH';
            if (level === 2) return 'MEDIUM';
            return 'LOW';
        }
        return level;
    }

    async getAIAnalysis(audit) {
        const prompt = `Provide a comprehensive analysis of this agent audit:
        
        Compliance Score: ${audit.compliance_score}/100
        Risk Level: ${audit.risk_assessment}
        Violations: ${audit.violations.join(', ')}
        
        Provide insights on:
        1. Overall assessment
        2. Key concerns
        3. Improvement opportunities
        4. Next steps`;

        try {
            const response = await openaiClient.chat.completions.create({
                model: process.env.OPENAI_MODEL || 'gpt-4',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 400,
                temperature: 0.3
            });

            return response.choices[0].message.content;
        } catch (error) {
            return 'AI analysis unavailable';
        }
    }

    generateAuditId() {
        return `AUDIT-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    }

    getAuditHistory(filters = {}) {
        let filtered = [...this.auditHistory];

        if (filters.agent_id) {
            filtered = filtered.filter(audit => audit.agent_id === filters.agent_id);
        }

        if (filters.risk_level) {
            filtered = filtered.filter(audit => audit.risk_assessment === filters.risk_level);
        }

        if (filters.compliance_threshold) {
            filtered = filtered.filter(audit => audit.compliance_score >= filters.compliance_threshold);
        }

        return filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    generateReport(filters = {}) {
        const history = this.getAuditHistory(filters);
        const totalAudits = history.length;
        const averageCompliance = history.reduce((sum, audit) => sum + audit.compliance_score, 0) / totalAudits;
        const highRiskCount = history.filter(audit => audit.risk_assessment === 'HIGH').length;

        return {
            summary: {
                total_audits: totalAudits,
                average_compliance: averageCompliance,
                high_risk_incidents: highRiskCount,
                compliance_rate: (history.filter(audit => audit.compliance_score >= 90).length / totalAudits) * 100
            },
            details: history,
            generated_at: new Date().toISOString()
        };
    }
}
```

This continues the file with the core modules. I'll continue adding the remaining sections in the next edit.
