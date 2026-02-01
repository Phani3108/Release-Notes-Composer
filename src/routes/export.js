import { Router } from "express";
import fs from "fs";
import { loadJSON, generateMarkdown, generatePersonalizedMarkdown } from "../modules/releaseNotes.js";
import { loadIncidents } from "../modules/incidents.js";
import { diffOpenAPI } from "../modules/openapiDiff.js";
import { findAnomalies, findIdleCandidates, formatTeamsCard } from "../modules/costDrift.js";
import { aiSummarize } from "../integrations/azureAi.js";

export const exportRouter = Router();

function asHTML(title, bodyPre) {
  return `<!doctype html><meta charset="utf-8"/><title>${title}</title>
  <style>body{font-family:ui-sans-serif;max-width:900px;margin:2rem auto;padding:0 1rem;white-space:pre-wrap}</style>
  <h2>${title}</h2><pre>${bodyPre}</pre>`;
}

/* Confluence-safe HTML: inline styles only, <pre>/<p>/<ul>/<li>, no scripts */
function asConfluenceHTML(title, text) {
  const esc = (s)=>s.replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));
  const body = esc(text)
    .replace(/^## (.*)$/gm, "<h2>$1</h2>")
    .replace(/^### (.*)$/gm, "<h3>$1</h3>")
    .replace(/^- (.*)$/gm, "<li>$1</li>")
    .replace(/\n\n/g, "<br/><br/>");
  return `<!doctype html><meta charset="utf-8"/><title>${esc(title)}</title>
  <div style="font-family:ui-sans-serif;max-width:900px;margin:2rem auto;padding:0 1rem">${body}</div>`;
}

// Release Notes (add ?user= and ?format=confluence)
exportRouter.get("/release-notes", async (req,res)=>{
  const fmt = String(req.query.format||"md");
  const user = String(req.query.user||"");
  const prs = loadJSON("data/mock_prs.json");
  const jira = JSON.parse(fs.readFileSync("data/mock_jira.json","utf-8"));
  let md;
  if (user) {
    const filters = JSON.parse(fs.readFileSync("data/filters.json","utf-8"));
    const f = (filters.users?.[user]) || (filters.teams?.[user]) || filters.defaults || { repos:[], labels:[] };
    md = generatePersonalizedMarkdown(prs, jira, f, user);
  } else {
    md = generateMarkdown(prs, jira);
  }

  if (fmt==="md") { res.setHeader("Content-Disposition","attachment; filename=release-notes.md"); return res.type("text/markdown").send(md); }
  if (fmt==="html") { res.setHeader("Content-Disposition","attachment; filename=release-notes.html"); return res.type("text/html").send(asHTML("Release Notes", md)); }
  if (fmt==="confluence") { res.setHeader("Content-Disposition","attachment; filename=release-notes-confluence.html"); return res.type("text/html").send(asConfluenceHTML("Release Notes", md)); }
  if (fmt==="json") { return res.type("application/json").send(JSON.stringify({ markdown: md }, null, 2)); }
  res.status(400).send("Unsupported format");
});

// Incidents (unchanged)
exportRouter.get("/incidents", (req,res)=>{
  const fmt = String(req.query.format||"md");
  const out = loadIncidents().map(i=>`## ${i.alertName}\n- Service: ${i.service}\n- Severity: ${i.severity}\n- ETA: ${i.eta}\n`).join("\n");
  if (fmt==="md") { res.setHeader("Content-Disposition","attachment; filename=incidents.md"); return res.type("text/markdown").send(out); }
  if (fmt==="html") { res.setHeader("Content-Disposition","attachment; filename=incidents.html"); return res.type("text/html").send(asHTML("Incidents", out)); }
  if (fmt==="json") { return res.type("application/json").send(JSON.stringify({ incidents: loadIncidents() }, null, 2)); }
  res.status(400).send("Unsupported format");
});

// API Diff (unchanged)
exportRouter.get("/api-diff", (req,res)=>{
  const fmt = String(req.query.format||"json");
  fs.writeFileSync("data/openapi_before.json", JSON.stringify({openapi:"3.0.0",paths:{"/x":{"get":{}}},components:{schemas:{U:{properties:{email:{},id:{}}}}}},null,2));
  fs.writeFileSync("data/openapi_after.json", JSON.stringify({openapi:"3.0.0",paths:{},components:{schemas:{U:{properties:{id:{}}}}}},null,2));
  const diff = diffOpenAPI("data/openapi_before.json","data/openapi_after.json");
  if (fmt==="json") { res.setHeader("Content-Disposition","attachment; filename=api-diff.json"); return res.json(diff); }
  if (fmt==="html") {
    const body = ["Breaking:", ...diff.breaking.map(x=>" - "+x), "", "PII:", ...diff.pii.map(x=>" - "+x)].join("\n");
    res.setHeader("Content-Disposition","attachment; filename=api-diff.html");
    return res.type("text/html").send(asHTML("API Diff", body));
  }
  res.status(400).send("Unsupported format");
});

// Cost Drift (unchanged)
exportRouter.get("/cost-drift", (_req,res)=>{
  const fmt = "format" in _req.query ? String(_req.query.format) : "txt";
  const costs = [
    {tag:"svc:auth",week:"2025-30",cost:100},
    {tag:"svc:auth",week:"2025-31",cost:140},
    {tag:"svc:payments",week:"2025-30",cost:200},
    {tag:"svc:payments",week:"2025-31",cost:205}
  ];
  const util = [
    {resource:"vm-auth-1", weekly:[2,3,1,2]},
    {resource:"vm-ml-3", weekly:[40,35,38,41]}
  ];
  const txt = formatTeamsCard(findAnomalies(costs,20), findIdleCandidates(util,5));
  if (fmt==="txt") { res.setHeader("Content-Disposition","attachment; filename=cost-drift.txt"); return res.type("text/plain").send(txt); }
  if (fmt==="html") { res.setHeader("Content-Disposition","attachment; filename=cost-drift.html"); return res.type("text/html").send(asHTML("Cost Drift", txt)); }
  if (fmt==="json") { return res.json({ anomalies: findAnomalies(costs,20), idle: findIdleCandidates(util,5) }); }
  res.status(400).send("Unsupported format");
});

// Executive Brief (unchanged)
exportRouter.get("/brief", async (_req,res)=>{
  const prs = loadJSON("data/mock_prs.json");
  const jira = JSON.parse(fs.readFileSync("data/mock_jira.json","utf-8"));
  const rn = generateMarkdown(prs, jira);
  const inc = loadIncidents().map(i=>`- ${i.alertName} (${i.severity}) on ${i.service}`).join("\n");
  const draft = `# Executive Brief\n## Release Notes\n${rn}\n## Incidents\n${inc}\n`;
  const fmt = "format" in _req.query ? String(_req.query.format) : "md";
  if (fmt==="html") {
    const md = await aiSummarize(draft, "Rewrite as concise HTML with bullet points.");
    res.setHeader("Content-Disposition","attachment; filename=brief.html");
    return res.type("text/html").send(asHTML("Executive Brief", md));
  }
  const md = await aiSummarize(draft, "Summarize in markdown bullets, ≤8 lines.");
  res.setHeader("Content-Disposition","attachment; filename=brief.md");
  res.type("text/markdown").send(md);
});
