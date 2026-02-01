# Master Project Instructions
<!-- LOCKED -->

## Project Overview
This project aims to build a suite of AI tools that integrate deeply with your SDLC, monitoring systems, and customer-facing interfaces. The system includes the following MVPs and Medium-term solutions:

1. **Release Notes Composer**  
2. **Incident Explainer Bot**  
3. **API Contract Gatekeeper (Lite)**  
4. **Cost Drift Pings (FinOps Lite)**  
5. **Agent Auditor & Hardener (Lite)**  
6. **Customer Issue Sentinel (Lite)**  
7. **AI Release Risk Manager**  
8. **Build-vs-Buy Advisor**
9. **Production Monitoring & Deployment Suite** ⭐ **NEW - Phase 7**

## 1. **System Design & Architecture**
Each MVP is to be developed according to the following principles:
- **Integration First**: Prioritize integrations with existing systems like GitHub, JIRA, Grafana, etc.
- **Simplicity in Output**: Focus on clear, customer-facing output where necessary (e.g., release notes, incident updates).
- **Modular & Scalable**: Components should be modular so that future improvements can be easily integrated without major rewrites.
- **Automation & Efficiency**: Automate repetitive tasks like PR checks, ticket creation, or monitoring alerts.
- **Production Ready**: Ensure all components are production-ready with monitoring, health checks, and security measures.

## 2. **Steps for Development**
- **Step 1**: **Set up API & Webhooks**
  - Integrate GitHub, JIRA, and Grafana using the respective APIs and webhooks.
  - Ensure all the incoming data can be processed reliably.

- **Step 2**: **Build Core Logic for MVP**
  - Implement the core functionality such as generating release notes, creating incident updates, detecting cost anomalies, etc.
  - Use GPT-5 (or other AI models) for summarization and decision-making.

- **Step 3**: **Testing & Validation**
  - Test all functions with mock data to ensure that output is as expected. 
  - Ensure no broken or incomplete classes/functions are left unfinished.

- **Step 4**: **System Monitoring**
  - Set up monitoring for system performance, reliability, and anomaly detection in every MVP.

- **Step 5**: **Final Output Format**
  - Ensure all results are provided in a consumable format like Markdown, HTML, or Teams cards, based on the use case.

- **Step 6**: **Approval Process**
  - Ensure that every component is tested and validated with **customer-facing** output before proceeding to the next phase.
  
- **Step 7**: **Documentation**
  - Every piece of functionality must be documented for future reference.

- **Step 8**: **Production Deployment** ⭐ **NEW - Phase 7**
  - Implement production monitoring, health checks, and security middleware.
  - Ensure all components are production-ready with proper metrics and deployment utilities.

## 3. **No Project is Complete Until**  
- No project will be marked complete unless:
  - All functionality is validated and passes testing.
  - No incomplete functions or classes exist.
  - Truth Policy is followed strictly and all external sources are properly integrated.
  - The project is compliant with scaling and monitoring strategies.
  - The project can reliably scale without breaking under load.
  - Production monitoring and health checks are implemented and tested.
  - Security middleware and production-ready features are in place.

## 4. **Version Control & Collaboration**
- All code should be versioned in GitHub. Each feature should be implemented in its own branch and merged only after passing testing and validation.
- Ensure detailed commit messages and PR descriptions.

## 5. **Stretch Goals**
- **Multi-language Support**: Add localization where possible (en/hi/te/ta).
- **Per-Tenant Configuration**: Include tenant-specific customization options in all outputs (e.g., Release Notes).
- **Customer Feedback Loops**: Implement systems for gathering customer feedback and iterating on the product.
- **Advanced Production Features**: Implement advanced monitoring, alerting, and scaling capabilities.

## 6. **Phase 7 Completion Status** ✅
**Phase 7: Production Monitoring & Deployment Suite - COMPLETE**

### New Features Added:
- **Production Monitoring**: Real-time metrics collection, health checks, and performance profiling
- **Enhanced Security**: Security headers, production middleware, and environment configuration
- **Deployment Utilities**: Deployment information, system status, and environment management
- **Performance Tracking**: Request timing, error rate monitoring, and endpoint analytics

### Production Endpoints:
- `/production/health` - Enhanced health check with detailed status
- `/production/metrics` - Real-time metrics and performance data
- `/production/status` - Comprehensive system status
- `/production/profile` - Performance insights and analytics
- `/production/config` - Environment configuration
- `/production/deployment` - Deployment information

### Next Phase: Production Deployment & Scaling
The system is now production-ready with comprehensive monitoring and security features. Ready for deployment to production environments with proper monitoring tools integration.

---

# 7. **AI-Native, Agentic-First Product Architecture** 🚀

## 7.1 What "AI-native, agentic-first" means for this product

**AI is the OS, not a widget.** Concretely:

* **Experience plane:** Teams + web surfaces that accept goals ("tell customers what changed"), not form inputs.
* **Reasoning plane:** agentic planners that choose *which existing modules* (release notes, incidents, API diff, cost) to call, in what order, with tool feedback loops.
* **Policy/Truth plane:** your `Truth_policy.md` + preflight lock + provenance; human approval gates.
* **Data plane:** only configured connectors (GitHub, JIRA, Grafana/Prom, Azure Cost Mgmt). No open-web retrieval.

Everything you've already built becomes **skills** the agents invoke. No new "function classes" required.

## 7.2 Personas → Goals → Agent behaviors (customer-first)

| Persona                        | Primary job to be done                                 | Agent behavior                                                                                        | Definition of "done"                                                   |
| ------------------------------ | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| **Eng Lead / Release Manager** | Get accurate, customer-grade release notes out quickly | Plan → gather PR+JIRA → cluster → summarize → risk tag → produce draft card → request approval        | Approved Adaptive Card posted to channel + changelog artifact exported |
| **SRE / On-call**              | Publish first incident update in minutes               | Parse alert → identify blast radius & ETA → propose next runbook step → produce customer update draft | Update card approved+posted within target SLA (e.g., ≤15 min)          |
| **API Owner**                  | Avoid breaking changes silently                        | Compare OpenAPI → classify risk → propose migration snippet → draft PR comment                        | PR comment present + JIRA subtask created for migration                |
| **FinOps / EM**                | Detect cost drift & reclaim waste                      | WoW anomaly detection + idle candidates → prioritized digest → safe actions                           | Weekly Teams digest + at least one reclaim ticket initiated            |
| **Exec / PM**                  | Understand key changes & risks                         | Condense system state into 5 bullets with provenance                                                  | Brief read in <60s; links to sources                                   |

## 7.3 Agent system design (no new classes; wrap existing modules as "skills")

### 7.3.1 Skills (you already have them)

* `releaseNotes.generate()` → from `src/modules/releaseNotes.js`
* `incidents.summarize()` → from `src/modules/incidents.js`
* `api.diff()` → from `src/modules/openapiDiff.js`
* `finops.report()` → from `src/modules/costDrift.js`
* `ai.summarize()` / `ai.classify()` → from `src/integrations/azureAi.js`
* `teams.postCard()` / `teams.postMessage()` → from `src/integrations/teams.js` or `graphTeams.js`

> These functions are your **tools**. Agents *only* call tools; they never fabricate data.

### 7.3.2 Agent roles (behaviors)

* **Planner** (lightweight): interprets the goal, chooses tools & order based on policies.
* **Drafting agent**: uses AI to transform facts → customer-grade text (deterministic prompts + temperature≈0.2).
* **Safety/Truth checker**: validates against `Truth_policy.md`, runs PII/DLP, attaches provenance.
* **Approval agent**: generates an Adaptive Card with "Approve / Ask Clarification / Add Note".

> All of the above can live as *pure functions* calling your existing modules; no class hierarchy needed.

### 7.3.3 Decision policy (when to act vs ask)

* **Never auto-post externally** (Teams/channel) without human approval.
* **Auto-draft allowed** when all facts come from configured connectors and provenance can be attached.
* **Escalate to human** if: missing source link, conflicting metrics, or high-risk (`api.breaking || incidents.critical`).

## 7.4 Experience design — AI-native UX

**Interaction pattern:** "brief → approve → publish", with the agent doing the boring parts.

* **Teams personal tab**: "My Feed" of drafts (release notes affecting my repos; incidents in my services).
* **Message extension ("compose" action):** `/release-notes` or `/incident` to insert the latest approved card into any conversation.
* **Adaptive Cards with Universal Actions**: Approve / Edit / Ask "why?" (the "why" opens a card section with provenance: PRs, JIRA keys, alerts).
* **Web dashboard**: admin tuneables (labels→feature mapping, incident templates, FinOps thresholds), exports (MD/HTML/JSON), and audit trail.

**AI-native affordances:**

* Inline "✅ Looks good / ✍️ Tweak tone / 🔍 Show sources" on every card.
* "What changed **for me**?" filter (repos I'm member of, labels I follow).
* Instant "Explain this diff" on any breaking change line or incident line (uses ai.summarize on the *selected* content only).

## 7.5 Safety, truth, and provenance (non-negotiable)

* **Provenance lines** on all drafts: `Sources: PR#123, JIRA AUTH-456, Alert INC-1`.
* **PII/DLP**: keep your middleware on all responses + re-run before posting to Teams.
* **Deterministic prompts**: pinned system prompts per artifact type; versioned and evaluated in CI.
* **No external retrieval** beyond configured connectors; offline by default if a connector is missing.

## 7.6 Evaluation & telemetry (how we trust the agents)

* **Functional**: golden sets for release notes (PR→expected bullets), incident (alert→blast radius/ETA), API (diff→expected flags).
* **Determinism**: same input + prompt → same output under seed; fail CI if drift > threshold.
* **Safety**: red-team prompts (e.g., ask for unconfigured data) must be refused.
* **Ops metrics**: time-to-first-draft, approval latency, % cards edited before approve, % breaking diffs caught, WoW cost saved.

## 7.7 AI-native data model (what the agents reason over)

* **Unified change object**:

  ```json
  {
    "id": "chg-2025-08-18-001",
    "sources": {"prs":[...], "jira":[...], "alerts":[...], "cost":[...]},
    "signals": {"risk":"Performance|Breaking|None", "blastRadius":"Low|Med|High"},
    "audience": ["customers", "internal"],
    "provenance": ["PR#123", "PAY-101", "INC-1"],
    "tenant": "default"
  }
  ```
* **Policy tags**: `confidence: high/med/low`, `requiresApproval: true`, `pii: false`.
* **Memory** (optional later): per-tenant glossary (product terms, module names), not user PII.

## 7.8 Where agentic & MCP fit (pragmatically)

* **Agentic orchestration**: yes, it's the *default runtime*, but with strict tool calling and approval gates.
* **MCP**: keep as a slim compatibility layer exposing your skills; helpful for future IDE assistants or other orchestrators. Make it **disabled by default** in prod until security reviewed.

## 7.9 10-day AI-native build plan (no overbuild)

**Day 1–2 — Agent behaviors + Teams first mile**

* Planner function: maps goals → ordered tool calls (release, incident, api, finops).
* Adaptive Card templates (draft, approve, sources).
* Personal tab in Teams pointing to your existing dashboard URL; webhook posting path working.

**Day 3 — "What changed for me?"**

* Filter by repo/label/team (config in `data/filters.json`).
* Personalized card list in tab.

**Day 4 — Approvals in Teams**

* Universal Actions: Approve / Edit note / Ask Why→show provenance.
* Audit trail record: draft → approved (request IDs).

**Day 5 — API Gatekeeper polish**

* PR comment formatter + migration snippet prompt pinned; deterministic tests.

**Day 6 — FinOps digest**

* Weekly digest card (manual trigger for hackathon) with deep links.

**Day 7 — Exec brief**

* One-click brief with sources; export MD/HTML; copy button.

**Day 8 — Evaluations in CI**

* Golden sets + determinism tests; gate CI.

**Day 9 — UX polish**

* Snappy dashboard, loading states, quick filters, dark mode; help tooltips on every button.

**Day 10 — Demo script & seed data**

* Scripted flow; sample PRs/JIRA/alerts; "two-minute miracle" demo.

## 7.10 Minimal glue you can drop in today (no new classes)

### A) Policy-driven planner (pure function)

Add to `src/modules/agentPlanner.js` (new file, functions only):

```js
// Maps a goal to an ordered list of existing skills to call.
export function plan(goal) {
  const g = goal.toLowerCase();
  if (g.includes("release")) return ["release.generate","ai.summarize","safety.check","ux.card.release"];
  if (g.includes("incident")) return ["incident.summarize","ai.summarize","safety.check","ux.card.incident"];
  if (g.includes("api")) return ["api.diff","ai.classify","safety.check","ux.card.api"];
  if (g.includes("cost")) return ["finops.report","ai.summarize","safety.check","ux.card.cost"];
  return ["ai.summarize"]; // default fallback
}
```

### B) Skills registry (thin wrappers over your existing functions)

Add to `src/modules/skillsRegistry.js`:

```js
import { loadJSON, generateMarkdown } from "./releaseNotes.js";
import { loadIncidents } from "./incidents.js";
import { diffOpenAPI } from "./openapiDiff.js";
import { findAnomalies, findIdleCandidates, formatTeamsCard } from "./costDrift.js";
import { aiSummarize, aiClassifyRisks } from "../integrations/azureAi.js";

export const skills = {
  "release.generate": async () => {
    const md = generateMarkdown(loadJSON("data/mock_prs.json"), JSON.parse(require("fs").readFileSync("data/mock_jira.json","utf-8")));
    return { type:"release", md, sources:["PRs","JIRA"] };
  },
  "incident.summarize": async () => {
    const items = loadIncidents().map(i=>`${i.alertName} (${i.severity}) on ${i.service}`);
    return { type:"incident", text: items.join("\n"), sources:["Alerts"] };
  },
  "api.diff": async () => {
    const before="data/openapi_before.json", after="data/openapi_after.json";
    const diff = diffOpenAPI(before, after);
    return { type:"api", diff, sources:["OpenAPI"] };
  },
  "finops.report": async () => {
    const costs=[{tag:"svc:auth",week:"1",cost:100},{tag:"svc:auth",week:"2",cost:140}];
    const util=[{resource:"vm-auth-1",weekly:[1,2,1,2,1]}];
    const a=findAnomalies(costs,20), i=findIdleCandidates(util,5);
    return { type:"finops", text: formatTeamsCard(a,i), sources:["AzureCost"] };
  },
  "ai.summarize": async (input) => {
    const text = input.md || input.text || JSON.stringify(input.diff);
    const out = await aiSummarize(text, "Summarize for customers. Keep concise; keep facts.");
    return { ...input, summary: out };
  },
  "ai.classify": async (input) => {
    const text = input.md || input.text || JSON.stringify(input.diff);
    const risk = await aiClassifyRisks(text);
    return { ...input, risk };
  },
  "safety.check": async (input) => {
    // attach provenance and mark needsApproval
    return { ...input, needsApproval:true, provenance: input.sources || [] };
  },
  // "ux.card.*" steps produce a canonical card payload (no Teams post yet)
  "ux.card.release": async (input) => ({ cardType:"adaptive", title:"Release Notes", body: input.summary || input.md, provenance: input.provenance }),
  "ux.card.incident": async (input) => ({ cardType:"adaptive", title:"Incident Update", body: input.summary || input.text, provenance: input.provenance }),
  "ux.card.api": async (input) => ({ cardType:"adaptive", title:"API Change Report", body: (input.summary || "") + "\n\n" + JSON.stringify(input.diff,null,2), provenance: input.provenance }),
  "ux.card.cost": async (input) => ({ cardType:"adaptive", title:"FinOps Weekly", body: input.summary || input.text, provenance: input.provenance }),
};
```

### C) The tiny agent loop (already close to what you have)

Add to `src/routes/agentic.js` or reuse your existing one:

```js
import { Router } from "express";
import { plan } from "../modules/agentPlanner.js";
import { skills } from "../modules/skillsRegistry.js";
import { makeReleaseNotesCard, teamsWebhookCard } from "../integrations/teams.js";
export const agenticRouter = Router();

agenticRouter.post("/goal", async (req,res)=>{
  const goal = String(req.body?.goal || "produce release notes");
  const steps = plan(goal);
  const log = req.app.get("sseLog") || (()=>{});
  let state = {};
  for (const s of steps) {
    log(`running: ${s}`);
    const fn = skills[s];
    state = await fn(state);
  }
  // Render Adaptive Card uniformly (reuse makeReleaseNotesCard for demo)
  const card = { "$schema":"http://adaptivecards.io/schemas/adaptive-card.json","type":"AdaptiveCard","version":"1.5",
    "body":[{"type":"TextBlock","size":"Large","weight":"Bolder","text": state.title || "Draft"},
            {"type":"TextBlock","wrap":true,"text": state.body || ""},
            {"type":"TextBlock","isSubtle":true,"spacing":"Small","text": "Sources: "+(state.provenance||[]).join(", ")}],
    "actions":[{"type":"Action.Submit","title":"Approve","data":{"action":"approve"}},
               {"type":"Action.Submit","title":"Ask why","data":{"action":"why"}}] };
  // don't auto-post; return the card payload to UI
  res.json({ ok:true, steps, card, state });
});
```

> This preserves your "no new classes" constraint: it's all functions + JSON configs, and it wraps your existing modules as skills.

## 7.11 Where to draw inspiration (and what not to copy)

* **Statuspage / incident.io** for crisp workflows & approvals (but keep your SDLC auto-draft angle).
* **Optic / Redocly** for API diff clarity (don't reinvent, focus on comms + migration snippet).
* **LaunchNotes / Beamer** for release note formatting (but you bring SDLC truth and Teams-native UX).

## 7.12 How we'll judge ourselves (North Star & guardrails)

* **North Star:** time-to-customer-ready message (TTCRM).
* **Guardrails:** zero unapproved external posts; 100% drafts include provenance; determinism ≥ 90 on golden sets; DLP zero escapes.

## 7.13 Final take

Build **from** AI, not "with" AI: goals in, facts out, narratives in the middle — all **inside Teams** with approvals and provenance. Keep agents humble and tool-using, not free-roaming. In 10 days, you can ship a credible, *agentic-first* product that saves hours each week and looks inevitable rather than aspirational.

---

## 8. **Next Steps & Implementation Priority**

### Immediate Actions (Next 48 hours):
1. **Implement Agent Planner** - Create `src/modules/agentPlanner.js` with goal-to-skills mapping
2. **Build Skills Registry** - Create `src/modules/skillsRegistry.js` wrapping existing modules
3. **Enhance Teams Integration** - Add Adaptive Card templates and approval workflows
4. **Setup Provenance Tracking** - Implement source tracking across all modules

### Week 1 Goals:
- Complete the 10-day AI-native build plan
- Implement all agent behaviors and safety checks
- Deploy Teams personal tab with "My Feed" functionality
- Setup evaluation framework with golden sets

### Success Metrics:
- **TTCRM (Time-to-Customer-Ready Message)**: Target <15 minutes for incidents, <2 hours for release notes
- **Approval Rate**: >90% of auto-generated drafts approved without edits
- **Provenance Coverage**: 100% of external communications include source links
- **Determinism Score**: >90% on golden set tests

This AI-native architecture transforms your existing SDLC suite into a truly agentic-first product that operates as an AI-native operating system for your development workflow.
