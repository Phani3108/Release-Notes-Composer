import { Router } from "express";
import express from "express";
import fs from "fs";
import crypto from "crypto";

import { makeReleaseNotesCard, makeIncidentCard, teamsWebhookCard, teamsWebhookPost } from "../integrations/teams.js";
import { loadJSON, generateMarkdown } from "../modules/releaseNotes.js";
import { loadIncidents } from "../modules/incidents.js";
import { postAdaptiveCardToChannel, updateChannelMessageCard } from "../integrations/graphTeams.js";
import { getUserEmail, can } from "../modules/policy.js";

export const teamsRouter = Router();

/* ---- tiny store ---- */
function storePath(){ return "data/approvals.json"; }
function readStore(){ if (!fs.existsSync(storePath())) fs.writeFileSync(storePath(),"{}"); return JSON.parse(fs.readFileSync(storePath(),"utf-8")); }
function writeStore(obj){ fs.writeFileSync(storePath(), JSON.stringify(obj,null,2)); }
function createApproval(payload){
  const token = crypto.randomUUID();
  const db = readStore();
  db[token] = { payload, status:"pending", ts: Date.now(), msgRef: null, surface: null };
  writeStore(db);
  return token;
}

/* ---- existing /teams/card remains available (Phase 3) ---- */
teamsRouter.get("/card", (req,res)=>{
  const type = String(req.query.type||"release-notes");
  const approve = String(req.query.approve||"0")==="1";
  const baseUrl = `${req.protocol}://${req.get("host")}`;

  if (type==="release-notes") {
    const prs = loadJSON("data/mock_prs.json");
    const jira = JSON.parse(fs.readFileSync("data/mock_jira.json","utf-8"));
    const md = generateMarkdown(prs, jira);
    let approveUrl;
    if (approve) { const token = createApproval({ kind:"release", md }); approveUrl = `${baseUrl}/teams/approve?token=${encodeURIComponent(token)}`; }
    const showProv = String(req.query.provenance||"1") === "1";
    return res.json(makeReleaseNotesCard({ title:"Release Notes", markdown: md, approveUrl, showProvenance: showProv }));
  }

  if (type==="incidents") {
    const inc = loadIncidents()[0] || { alertName:"Unknown", service:"n/a", severity:"n/a" };
    const text = `${inc.alertName} (${inc.severity}) on ${inc.service}`;
    const grafanaUrl = process.env.GRAFANA_BASE_URL ? `${process.env.GRAFANA_BASE_URL}/d/xyz?var_service=${encodeURIComponent(inc.service)}` : "";
    const sentryUrl = process.env.SENTRY_BASE_URL ? `${process.env.SENTRY_BASE_URL}/issues/?query=${encodeURIComponent(inc.service)}` : "";
    let approveUrl, updateEtaUrl;
    if (approve) {
      const token = createApproval({ kind:"incident", text, eta:"TBD", grafanaUrl, sentryUrl });
      approveUrl = `${baseUrl}/teams/approve?token=${encodeURIComponent(token)}`;
      updateEtaUrl = `${baseUrl}/teams/incident/update-form?token=${encodeURIComponent(token)}`;
    }
    const showProv = String(req.query.provenance||"1") === "1";
    return res.json(makeIncidentCard({ title:"Incident Update", text, grafanaUrl, sentryUrl, approveUrl, updateEtaUrl, eta:"TBD", showProvenance: showProv }));
  }

  return res.json({ "$schema":"http://adaptivecards.io/schemas/adaptive-card.json","type":"AdaptiveCard","version":"1.5","body":[{"type":"TextBlock","text":"Unknown type","size":"Large"}]});
});

/* ---- Post with approval (stores msgRef when Graph) ---- */
teamsRouter.post("/post-with-approval", async (req,res)=>{
  const type = String(req.query.type||"release-notes");
  const baseUrl = `${req.protocol}://${req.get("host")}`;

  if (type==="release-notes") {
    const prs = loadJSON("data/mock_prs.json");
    const jira = JSON.parse(fs.readFileSync("data/mock_jira.json","utf-8"));
    const md = generateMarkdown(prs, jira);
    const token = createApproval({ kind:"release", md });
    const approveUrl = `${baseUrl}/teams/approve?token=${encodeURIComponent(token)}`;
    const showProv = String(req.query.provenance||"1") === "1";
    const card = makeReleaseNotesCard({ title:"Release Notes", markdown: md, approveUrl, showProvenance: showProv });
    try {
      if (process.env.TENANT_ID && process.env.CLIENT_ID && process.env.CLIENT_SECRET && process.env.TEAM_ID && process.env.CHANNEL_ID) {
        const posted = await postAdaptiveCardToChannel(card);
        const db = readStore(); db[token].msgRef = posted.id; db[token].surface = "graph"; writeStore(db);
        return res.json({ ok:true, token, msgId: posted.id, surface:"graph" });
      } else {
        await teamsWebhookCard(card);
        const db = readStore(); db[token].surface = "webhook"; writeStore(db);
        return res.json({ ok:true, token, surface:"webhook" });
      }
    } catch (e) { console.error("post-with-approval RN failed", e?.response?.data || e?.message); return res.status(500).json({ ok:false }); }
  }

  if (type==="incidents") {
    const inc = loadIncidents()[0] || { alertName:"Unknown", service:"n/a", severity:"n/a" };
    const text = `${inc.alertName} (${inc.severity}) on ${inc.service}`;
    const grafanaUrl = process.env.GRAFANA_BASE_URL ? `${process.env.GRAFANA_BASE_URL}/d/xyz?var_service=${encodeURIComponent(inc.service)}` : "";
    const sentryUrl = process.env.SENTRY_BASE_URL ? `${process.env.SENTRY_BASE_URL}/issues/?query=${encodeURIComponent(inc.service)}` : "";
    const token = createApproval({ kind:"incident", text, eta:"TBD", grafanaUrl, sentryUrl });
    const approveUrl = `${baseUrl}/teams/approve?token=${encodeURIComponent(token)}`;
    const updateEtaUrl = `${baseUrl}/teams/incident/update-form?token=${encodeURIComponent(token)}`;
    const showProv = String(req.query.provenance||"1") === "1";
    const card = makeIncidentCard({ title:"Incident Update", text, grafanaUrl, sentryUrl, approveUrl, updateEtaUrl, eta:"TBD", showProvenance: showProv });

    try {
      if (process.env.TENANT_ID && process.env.CLIENT_ID && process.env.CLIENT_SECRET && process.env.TEAM_ID && process.env.CHANNEL_ID) {
        const posted = await postAdaptiveCardToChannel(card);
        const db = readStore(); db[token].msgRef = posted.id; db[token].surface = "graph"; writeStore(db);
        return res.json({ ok:true, token, msgId: posted.id, surface:"graph" });
      } else {
        await teamsWebhookCard(card);
        const db = readStore(); db[token].surface = "webhook"; writeStore(db);
        return res.json({ ok:true, token, surface:"webhook" });
      }
    } catch (e) { console.error("post-with-approval INC failed", e?.response?.data || e?.message); return res.status(500).json({ ok:false }); }
  }

  return res.status(400).json({ ok:false, error:"unknown type" });
});

/* ---- Approve endpoint (Phase 3) keeps updating original message if Graph ---- */
teamsRouter.get("/approve", async (req,res)=>{
  const token = String(req.query.token||"");
  const db = readStore(); const rec = db[token];
  if (!rec) return res.status(404).type("text/html").send("<h3>Approval token not found or expired.</h3>");

  const user = getUserEmail(req);
  if (user && !can(user, rec.payload.kind==="incident" ? "approve_incident" : "approve_release")) {
    return res.status(403).type("text/html").send("<h3>Not authorized to approve.</h3>");
  }

  if (rec.status !== "approved") {
    rec.status = "approved"; rec.approvedAt = Date.now(); writeStore(db);
    try {
      const card = rec.payload.kind==="incident"
        ? makeIncidentCard({ title:"Incident Update (Approved)", text: rec.payload.text, grafanaUrl: rec.payload.grafanaUrl, sentryUrl: rec.payload.sentryUrl, eta: rec.payload.eta })
        : makeReleaseNotesCard({ title:"Release Notes (Approved)", markdown: rec.payload.md });

      if (rec.surface==="graph" && rec.msgRef) { await updateChannelMessageCard(rec.msgRef, card, "Approved"); }
      else { await teamsWebhookPost(`Approved: ${rec.payload.kind} at ${new Date(rec.approvedAt).toISOString()}`); }
    } catch (e) { console.error("approve update failed", e?.response?.data || e?.message); }
  }
  res.type("text/html").send("<h3>Thanks! Draft approved.</h3><p>You may close this window.</p>");
});

/* ---- NEW: Incident ETA update form + submit ---- */
teamsRouter.get("/incident/update-form", (req,res)=>{
  const token = String(req.query.token||"");
  const db = readStore(); const rec = db[token];
  if (!rec) return res.status(404).type("text/html").send("<h3>Token not found.</h3>");
  const html = `<!doctype html><meta charset="utf-8"/><title>Update ETA</title>
  <style>body{font-family:ui-sans-serif;max-width:560px;margin:2rem auto}</style>
  <h2>Update ETA</h2>
  <form method="POST" action="/teams/incident/submit-eta">
    <input type="hidden" name="token" value="${encodeURIComponent(token)}"/>
    <label>New ETA (e.g., 45m or 2025-08-18T15:30Z)</label><br/>
    <input name="eta" style="width:100%;padding:8px;margin:6px 0"/><br/>
    <label>Note (optional)</label><br/>
    <textarea name="note" style="width:100%;height:100px;padding:8px;margin:6px 0"></textarea><br/>
    <button type="submit">Update</button>
  </form>`;
  res.type("text/html").send(html);
});

teamsRouter.post("/incident/submit-eta", express.urlencoded({extended:true}), async (req,res)=>{
  const token = String(req.body.token||"");
  const eta = String(req.body.eta||"TBD");
  const note = String(req.body.note||"");
  const db = readStore(); const rec = db[token];
  if (!rec) return res.status(404).type("text/html").send("<h3>Token invalid.</h3>");
  
  const user = getUserEmail(req);
  if (user && !can(user, "update_incident_eta")) {
    return res.status(403).type("text/html").send("<h3>Not authorized to update ETA.</h3>");
  }
  
  rec.payload.eta = eta; rec.payload.note = note; writeStore(db);

  try {
    const card = makeIncidentCard({
      title: "Incident Update (ETA revised)",
      text: rec.payload.text + (note ? `\n\nNote: ${note}` : ""),
      grafanaUrl: rec.payload.grafanaUrl, sentryUrl: rec.payload.sentryUrl, eta
    });
    if (rec.surface==="graph" && rec.msgRef) {
      await updateChannelMessageCard(rec.msgRef, card, "ETA updated");
    } else {
      await teamsWebhookPost(`Incident ETA updated: ${eta}${note ? " — "+note : ""}`);
    }
  } catch (e) { console.error("ETA update failed", e?.response?.data || e?.message); }

  res.type("text/html").send("<h3>ETA updated.</h3><p>You may close this window.</p>");
});

/* ---- status & deep link helpers retained ---- */
teamsRouter.get("/approval/status", (req,res)=>{
  const token = String(req.query.token||""); const db = readStore(); const rec = db[token];
  if (!rec) return res.status(404).json({ ok:false }); res.json({ ok:true, status: rec.status, surface: rec.surface, msgRef: rec.msgRef || null });
});

teamsRouter.post("/post-card", async (req,res)=>{
  const useGraph = process.env.TENANT_ID && process.env.CLIENT_ID && process.env.CLIENT_SECRET && process.env.TEAM_ID && process.env.CHANNEL_ID;
  try { if (useGraph) await postAdaptiveCardToChannel(req.body); else await teamsWebhookCard(req.body); res.json({ok:true}); }
  catch (e) { console.error("Teams post failed", e?.response?.data || e?.message); res.status(500).json({ok:false}); }
});
