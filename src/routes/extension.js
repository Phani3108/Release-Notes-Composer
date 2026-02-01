import { Router } from "express";
import fs from "fs";
import { loadJSON, generateMarkdown } from "../modules/releaseNotes.js";

export const extensionRouter = Router();

function approvalsPath(){ return "data/approvals.json"; }
function readApprovals(){
  if (!fs.existsSync(approvalsPath())) fs.writeFileSync(approvalsPath(),"{}");
  return JSON.parse(fs.readFileSync(approvalsPath(),"utf-8"));
}

// Search PR titles (local mock)
extensionRouter.get("/search", (req,res)=>{
  const q = String(req.query.q||"").toLowerCase();
  const prs = loadJSON("data/mock_prs.json");
  const items = prs.filter(p=>p.title.toLowerCase().includes(q)).slice(0,10)
    .map(p=>({ id: p.pr_number, title: p.title, repo: p.repo||"" }));
  res.json({ items });
});

// Card for a single PR
extensionRouter.get("/card", (req,res)=>{
  const id = Number(req.query.id||0);
  const prs = loadJSON("data/mock_prs.json");
  const p = prs.find(x=>x.pr_number===id);
  if (!p) return res.status(404).json({ ok:false });
  const md = generateMarkdown([p], {});
  res.json({ card: { "$schema":"http://adaptivecards.io/schemas/adaptive-card.json","type":"AdaptiveCard","version":"1.5","body":[{"type":"TextBlock","size":"Large","weight":"Bolder","text":"Release Note (Single PR)"},{"type":"TextBlock","wrap":true,"text": md}] } });
});

// Latest approved draft (release or incident)
extensionRouter.get("/latest-approved", (req,res)=>{
  const kind = String(req.query.kind||"release");
  const db = readApprovals();
  const recs = Object.values(db).filter(r=>r?.payload?.kind===kind && r.status==="approved")
    .sort((a,b)=> (b.approvedAt||0)-(a.approvedAt||0));
  if (!recs.length) return res.json({ ok:false, message:"No approved drafts" });
  const r = recs[0];
  const text = r.payload.md || r.payload.text || "";
  res.json({ ok:true, text });
});
