# Hackathon Demo — 2 Minute Script (no creds required)

> Goal: show AI-native, Teams-first flows with truth guardrails & approvals.

## Setup (30s)
1. `npm i && npm run demo:seed && npm run dev`
2. Open http://localhost:3000/ui/dashboard.html
3. (Optional) Put your Teams webhook in `.env` and restart.

## Flow (90s)
### A) Release → Approve → Post
- Click **Release Notes → Preview (with Approve)** → show card JSON and **Provenance** lines.
- Click **Post (with Approve)** → card lands in Teams (webhook or Graph).
- In Teams, click **Approve** → message updates (Graph) or follow-up appears (webhook).

**Value callout:** hours saved turning PR/JIRA exhaust into customer-grade notes with explicit provenance.

### B) Incident Update with ETA
- Click **Incidents → Post (with Approve)**.
- In Teams, click **Update ETA**, submit "45m + note".
- Card updates in place (Graph) or follow-up posts (webhook). Optionally **Approve**.

**Value:** fast, consistent comms during outages; human-in-the-loop approval.

### C) "What changed for me?"
- Enter `me@example.com` → **Generate Mine**.
- Export **Confluence HTML** and **Markdown**.

**Value:** personalized comms for each team.

### D) API Gatekeeper + Migration Checklist
- Click **Migration Checklist → Generate** → tasks appear.
- (Optional) Add `PROJ-123` → **Create JIRA Subtasks** (simulated without creds).

**Value:** guardrails on API breaks; automatic migration work items.

### E) Truth Audit
- Click **Run Truth Audit** → report shows no errors (warnings ok).
- Explain: no open web; only configured connectors; locked Truth/ Master docs.

**Close:** "AI-native, Teams-first communication layer for SDLC — accurate, approved, and fast."
