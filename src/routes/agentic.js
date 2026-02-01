import { Router } from "express";
import fs from "fs";
import YAML from "yaml";

// === EXISTING MODULES AS TOOLS (skills) ===
import { loadJSON, generateMarkdown } from "../modules/releaseNotes.js";
import { loadIncidents } from "../modules/incidents.js";
import { diffOpenAPI } from "../modules/openapiDiff.js";
import { findAnomalies, findIdleCandidates, formatTeamsCard } from "../modules/costDrift.js";
import { aiSummarize, aiClassifyRisks } from "../integrations/azureAi.js";

export const agenticRouter = Router();

// ---- Planner: maps natural-language goals to tool pipeline (no classes) ----
function plan(goal) {
  const g = String(goal || "").toLowerCase();
  if (g.includes("release")) return ["release.generate", "ai.summarize", "safety.check", "ux.card.release"];
  if (g.includes("incident")) return ["incident.summarize", "ai.summarize", "safety.check", "ux.card.incident"];
  if (g.includes("api") || g.includes("contract")) return ["api.diff", "ai.classify", "safety.check", "ux.card.api"];
  if (g.includes("cost") || g.includes("finops")) return ["finops.report", "ai.summarize", "safety.check", "ux.card.cost"];
  // default: give executive brief of current state
  return ["release.generate", "incident.summarize", "ai.summarize", "safety.check", "ux.card.release"];
}

// ---- Skills registry: thin wrappers over existing modules (no classes) ----
const skills = {
  async "release.generate"(state) {
    const prs = loadJSON("data/mock_prs.json");
    const jira = JSON.parse(fs.readFileSync("data/mock_jira.json", "utf-8"));
    return { ...state, type: "release", md: generateMarkdown(prs, jira), sources: ["PRs", "JIRA"] };
  },
  async "incident.summarize"(state) {
    const items = loadIncidents().map(i => `${i.alertName} (${i.severity}) on ${i.service}`);
    return { ...state, type: "incident", text: items.join("\n"), sources: ["Alerts"] };
  },
  async "api.diff"(state) {
    // Expect you to populate data/openapi_* in later phases; for now we demo with local files if present.
    const before = "data/openapi_before.json";
    const after = "data/openapi_after.json";
    if (!fs.existsSync(before) || !fs.existsSync(after)) {
      // create a tiny demo pair deterministically
      fs.writeFileSync(before, JSON.stringify({ openapi: "3.0.0", paths: { "/x": { get: {} } }, components: { schemas: { U: { properties: { email: {}, id: {} } } } } }, null, 2));
      fs.writeFileSync(after, JSON.stringify({ openapi: "3.0.0", paths: {}, components: { schemas: { U: { properties: { id: {} } } } } }, null, 2));
    }
    const diff = diffOpenAPI(before, after);
    return { ...state, type: "api", diff, sources: ["OpenAPI"] };
  },
  async "finops.report"(state) {
    // local demo dataset; later phases plug Azure Cost Mgmt
    const costs = [
      { tag: "svc:auth", week: "2025-30", cost: 100 },
      { tag: "svc:auth", week: "2025-31", cost: 140 }
    ];
    const util = [{ resource: "vm-auth-1", weekly: [1, 2, 1, 2, 1] }];
    const a = findAnomalies(costs, 20), i = findIdleCandidates(util, 5);
    return { ...state, type: "finops", text: formatTeamsCard(a, i), sources: ["AzureCost"] };
  },
  async "ai.summarize"(state) {
    const payload = state.md || state.text || JSON.stringify(state.diff, null, 2);
    const out = await aiSummarize(payload, "Summarize for customers; concise; keep facts; no speculation.");
    return { ...state, summary: out };
  },
  async "ai.classify"(state) {
    const payload = state.md || state.text || JSON.stringify(state.diff, null, 2);
    const risk = await aiClassifyRisks(payload);
    return { ...state, risk };
  },
  async "safety.check"(state) {
    // Attach provenance + require approval; your DLP middleware still runs at response time
    const provenance = state.sources || [];
    return { ...state, needsApproval: true, provenance };
  },
  async "ux.card.release"(state) {
    return {
      ...state,
      card: {
        "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
        "type": "AdaptiveCard", "version": "1.5",
        "body": [
          { "type": "TextBlock", "size": "Large", "weight": "Bolder", "text": "Release Notes" },
          { "type": "TextBlock", "wrap": true, "text": state.summary || state.md || "" },
          { "type": "TextBlock", "isSubtle": true, "spacing": "Small", "text": "Sources: " + (state.provenance || []).join(", ") }
        ],
        "actions": [
          { "type": "Action.Submit", "title": "Approve", "data": { "action": "approve" } }
        ]
      }
    };
  },
  async "ux.card.incident"(state) {
    return {
      ...state,
      card: {
        "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
        "type": "AdaptiveCard", "version": "1.5",
        "body": [
          { "type": "TextBlock", "size": "Large", "weight": "Bolder", "text": "Incident Update" },
          { "type": "TextBlock", "wrap": true, "text": state.summary || state.text || "" },
          { "type": "TextBlock", "isSubtle": true, "spacing": "Small", "text": "Sources: " + (state.provenance || []).join(", ") }
        ],
        "actions": [
          { "type": "Action.Submit", "title": "Acknowledge", "data": { "action": "ack" } }
        ]
      }
    };
  },
  async "ux.card.api"(state) {
    const body = (state.summary || "") + "\n\n" + JSON.stringify(state.diff, null, 2);
    return {
      ...state,
      card: {
        "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
        "type": "AdaptiveCard", "version": "1.5",
        "body": [
          { "type": "TextBlock", "size": "Large", "weight": "Bolder", "text": "API Change Report" },
          { "type": "TextBlock", "wrap": true, "text": body },
          { "type": "TextBlock", "isSubtle": true, "spacing": "Small", "text": "Risk: " + (state.risk || "None") }
        ]
      }
    };
  },
  async "ux.card.cost"(state) {
    return {
      ...state,
      card: {
        "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
        "type": "AdaptiveCard", "version": "1.5",
        "body": [
          { "type": "TextBlock", "size": "Large", "weight": "Bolder", "text": "FinOps Weekly" },
          { "type": "TextBlock", "wrap": true, "text": state.summary || state.text || "" }
        ]
      }
    };
  }
};

// ---- Agent endpoint: runs plan, streams logs over SSE, returns card/state ----
agenticRouter.post("/goal", async (req, res) => {
  const log = req.app.get("sseLog") || (() => {});
  const goal = String(req.body?.goal || "produce release notes");
  const steps = plan(goal);
  let state = {};
  for (const s of steps) {
    log(`run: ${s}`);
    state = await skills[s](state);
  }
  res.json({ ok: true, steps, state, card: state.card || null });
});

// Simple kick-off used by UI button (kept for backward compatibility)
agenticRouter.post("/run", async (_req, res) => {
  const log = _req.app.get("sseLog") || (() => {});
  const steps = plan("produce release notes");
  let state = {};
  for (const s of steps) { log(`run: ${s}`); state = await skills[s](state); }
  res.json({ ok: true, steps, state, card: state.card || null });
});
