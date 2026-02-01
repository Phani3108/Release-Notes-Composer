import { Router } from "express";
import { loadJSON, generateMarkdown, generatePersonalizedMarkdown } from "../modules/releaseNotes.js";
import { aiSummarize } from "../integrations/azureAi.js";
import { teamsWebhookCard, makeReleaseNotesCard } from "../integrations/teams.js";
import { ensureConnection, setSchema, upsertItem } from "../integrations/graphConnectors.js";
import fs from "fs";

export const releaseNotesRouter = Router();

releaseNotesRouter.get("/", async (req,res)=>{
  const prs = loadJSON("data/mock_prs.json");
  const jira = loadJSON("data/mock_jira.json");
  const md = generateMarkdown(prs, jira);
  const summary = await aiSummarize(md, "Summarize as customer-facing notes.");
  if (req.flags?.postTeams) {
    await teamsWebhookCard(makeReleaseNotesCard({ title:"Release Notes (Local)", markdown: summary }));
  }
  try {
    if (req.flags?.indexGraph) {
      await ensureConnection(); await setSchema();
      await upsertItem("rn-local", { type:"release-note", title:"Local Demo", module:"Mixed", risk:"None", url:"", contentMd: summary });
    }
  } catch { /* optional */ }
  res.type("text/markdown").send(summary);
});

/* ------- PHASE 2: Personalized endpoint -------- */
releaseNotesRouter.get("/my", async (req,res)=>{
  const user = String(req.query.user||req.headers["x-user-email"]||"");
  const filters = JSON.parse(fs.readFileSync("data/filters.json","utf-8"));
  const f = (filters.users?.[user]) || (filters.teams?.[user]) || filters.defaults || { repos:[], labels:[] };

  const prs = loadJSON("data/mock_prs.json");
  const jira = loadJSON("data/mock_jira.json");
  const md = generatePersonalizedMarkdown(prs, jira, f, user || "you");
  const out = await aiSummarize(md, "Rewrite into crisp bullets tailored to the audience; keep module names and PR numbers.");
  res.type("text/markdown").send(out);
});
