# Microsoft Integrations

This directory contains drop-in modules for integrating the WorldClass SDLC Suite with Microsoft services. All integrations gracefully fall back to local functionality when not configured, maintaining the project's "local-first" philosophy.

## Quick Start

1. **Install dependencies** (already done):
   ```bash
   npm install @azure/identity @microsoft/microsoft-graph-client isomorphic-fetch dotenv
   ```

2. **Configure environment variables** (create `.env` file):
   ```bash
   # Copy from .env.example and fill in your values
   cp .env.example .env
   ```

3. **Test integrations**:
   ```bash
   npm run test:integrations
   ```

## Available Integrations

### 1. Microsoft Teams

#### A) Simple Webhook (Recommended for quick start)
- **File**: `teams.js`
- **Setup**: Create Incoming Webhook in Teams channel → copy URL → set `TEAMS_WEBHOOK_URL`
- **Usage**: Post simple messages and Adaptive Cards
- **No authentication required**

#### B) Graph API (Rich features)
- **File**: `graphTeams.js`
- **Setup**: App Registration + client secret + admin consent
- **Usage**: Post to channels, reply in threads, rich Adaptive Cards
- **Requires**: `TENANT_ID`, `CLIENT_ID`, `CLIENT_SECRET`, `TEAM_ID`, `CHANNEL_ID`

### 2. Azure AI (Azure OpenAI)

#### **File**: `azureAi.js`
- **Features**: Text summarization, risk classification
- **Fallback**: Local logic when API keys not configured
- **Setup**: Azure OpenAI resource + API key + deployment name
- **Requires**: `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_DEPLOYMENT`

### 3. Microsoft Graph Connectors

#### **File**: `graphConnectors.js`
- **Purpose**: Make release notes, incidents, tickets searchable in Microsoft Search
- **Setup**: App Registration + permissions + admin consent
- **Requires**: `TENANT_ID`, `CLIENT_ID`, `CLIENT_SECRET`
- **Optional**: `GRAPH_CONN_ID` (defaults to "worldclass")

## Integration Points by Phase

### Phase 1: Release Notes Composer
```javascript
import { teamsWebhookCard, makeReleaseNotesCard } from "../integrations/teams.js";
import { aiSummarize } from "../integrations/azureAi.js";
import { upsertItem } from "../integrations/graphConnectors.js";

// After generating release notes
const summary = await aiSummarize(md, "Write crisp customer-facing release notes.");
await teamsWebhookCard(makeReleaseNotesCard({ title: "Release Notes", markdown: md }));
await upsertItem(`rn-${pr.pr_number}`, { type: "release-note", title: pr.title, module: feature, risk, url: "", contentMd: md });
```

### Phase 2: Incident Explainer
```javascript
import { teamsWebhookPost } from "../integrations/teams.js";
import { upsertItem } from "../integrations/graphConnectors.js";

// After formatting incident
await teamsWebhookPost(formatIncident(i));
await upsertItem(`inc-${incident.id}`, { type: "incident", title: incident.title, module: "Core", risk: incident.severity, url: "", contentMd: formatIncident(i) });
```

### Phase 3: API Gatekeeper + Cost Drift
```javascript
import { teamsWebhookCard } from "../integrations/teams.js";

// When detecting breaking changes or PII
if (hasBreakingChanges) {
  await teamsWebhookCard(makeAlertCard({ title: "Breaking Changes Detected", markdown: "..." }));
}
```

### Phase 4: Agent Auditor + Ticket Sentinel
```javascript
import { teamsWebhookPost } from "../integrations/teams.js";

// Post agent trust score
await teamsWebhookPost(`Agent Trust Score: ${trustScore}/100`);
```

### Phase 5: Release Risk + Build-vs-Buy
```javascript
import { teamsWebhookCard } from "../integrations/teams.js";

// Post release health summary
await teamsWebhookCard(makeReleaseHealthCard({ title: "Release Health", markdown: healthSummary }));
```

## Environment Variables

```bash
# ===== Teams (choose ONE path) =====
# 1) Simple Incoming Webhook
TEAMS_WEBHOOK_URL=

# 2) Graph API (channel messages / adaptive cards)
TENANT_ID=
CLIENT_ID=
CLIENT_SECRET=
TEAM_ID=
CHANNEL_ID=

# ===== Azure AI (Azure OpenAI) =====
AZURE_OPENAI_ENDPOINT=              # e.g. https://your-resource.openai.azure.com
AZURE_OPENAI_API_KEY=
AZURE_OPENAI_DEPLOYMENT=            # your chat/completions deployment name

# ===== Graph Connectors (External Connections) =====
GRAPH_CONN_ID=worldclass
```

## Security & Permissions

### Teams Webhook
- **None required** - URL is the secret
- **Keep webhook URL private** in `.env`

### Graph API (App-only)
- **App Registration** with client secret
- **Required permissions** + **Admin consent**
- **Scopes**: `ChannelMessage.Send`, `Team.ReadBasic.All`
- **For connectors**: `ExternalConnection.ReadWrite.OwnedBy`, `ExternalItem.ReadWrite.OwnedBy`

### Azure OpenAI
- **Resource endpoint** + API key + deployment name
- **For production**: Move to Azure Key Vault + Managed Identity

## Testing

Run the integration test to verify all modules work with local fallbacks:

```bash
npm run test:integrations
```

This will test:
- Teams webhook messaging
- Adaptive Card creation
- AI summarization (local fallback)
- Risk classification (local fallback)
- Graph Connectors setup
- Graph Teams messaging

## Troubleshooting

### Common Issues

1. **"TEAMS_WEBHOOK_URL not set; skipping"**
   - Expected when not configured
   - Set `TEAMS_WEBHOOK_URL` in `.env` to enable

2. **"403 Forbidden" from Graph API**
   - Check app permissions are granted
   - Ensure admin consent is given
   - Verify `TENANT_ID`, `CLIENT_ID`, `CLIENT_SECRET`

3. **"401 Unauthorized" from Azure OpenAI**
   - Verify endpoint URL format
   - Check API key is correct
   - Ensure deployment name matches exactly

4. **"isomorphic-fetch" errors**
   - Ensure `isomorphic-fetch` is installed
   - Check Node.js version compatibility

### Debug Mode

Set `DEBUG=true` in `.env` for verbose logging:

```bash
DEBUG=true npm run test:integrations
```

## Production Considerations

1. **Move secrets to Azure Key Vault**
2. **Use Managed Identity** instead of client secrets
3. **Implement proper error handling** and retry logic
4. **Add monitoring** for integration health
5. **Set up alerting** for integration failures

## Local Development

All integrations work locally without external services:
- Teams: Messages are logged to console
- Azure AI: Uses local fallback logic
- Graph Connectors: Operations are skipped gracefully

This ensures the development workflow remains smooth while enabling production integrations when ready.
