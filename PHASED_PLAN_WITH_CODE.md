# Worldclass SDLC Suite — All Phases (Code + Checks)

> Local-first with mocks; flips to Microsoft Teams, Azure AI, and Microsoft Graph (incl. Graph Connectors) when `.env` is set.
> Honors your **Master_file.md** + **Truth_policy.md** lock (no hallucinations, no stray files, no TODOs).

---

## Bootstrap (run these in a fresh folder)

```bash
# 0) Create repo root
mkdir worldclass-sdlc-suite && cd $_
git init

# 1) Create folders
mkdir -p src/{routes,modules,integrations,middleware,utils} data tests scripts docs public backups

# 2) Paste files from this doc (use the exact paths below)

# 3) Install deps
npm install

# 4) Lock Master & Truth (after you paste your real docs)
node scripts/initTruthLock.js

# 5) Preflight
npm run check:preflight

# 6) Run dev server
npm run dev
#  - GET http://localhost:3000/release-notes
#  - GET http://localhost:3000/incidents
#  - GET http://localhost:3000/ui

# 7) Execute phases
npm run phase:1
npm run phase:2
npm run phase:3 && node scripts/runPhase3DemoCosts.js
npm run phase:4 && node scripts/runPhase4DemoTickets.js
npm run phase:5 && node scripts/runPhase5DemoBvB.js
npm run phase:6
```

---

## Root files

### `package.json`

```json
{
  "name": "worldclass-sdlc-suite",
  "version": "0.1.0",
  "type": "module",
  "main": "src/index.js",
  "scripts": {
    "dev": "node src/index.js",
    "test": "node --test",
    "check:preflight": "node scripts/preflight.js",
    "lock:truth": "node scripts/initTruthLock.js",
    "phase:1": "npm run check:preflight && node scripts/runPhase1Demo.js",
    "phase:2": "npm run check:preflight && node scripts/runPhase2Demo.js",
    "phase:3": "npm run check:preflight && node scripts/runPhase3Demo.js",
    "phase:4": "npm run check:preflight && node scripts/runPhase4Demo.js",
    "phase:5": "npm run check:preflight && node scripts/runPhase5Demo.js",
    "phase:6": "npm run check:preflight && node scripts/runPhase6Audit.js"
  },
  "dependencies": {
    "@azure/identity": "^4.5.0",
    "@microsoft/microsoft-graph-client": "^3.0.7",
    "axios": "^1.7.4",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "isomorphic-fetch": "^3.0.0",
    "yaml": "^2.4.5"
  }
}
```

### `.env.example`

```bash
# ===== Teams (choose ONE path) =====
TEAMS_WEBHOOK_URL=

# Graph (app-only)
TENANT_ID=
CLIENT_ID=
CLIENT_SECRET=
TEAM_ID=
CHANNEL_ID=

# ===== Azure AI (Azure OpenAI) =====
AZURE_OPENAI_ENDPOINT=
AZURE_OPENAI_API_KEY=
AZURE_OPENAI_DEPLOYMENT=

# ===== Graph Connector =====
GRAPH_CONN_ID=worldclass
```

### `Master_file.md`  *(replace with your final doc before locking)*

```md
# Master File (replace with your finalized master doc)
# Kept minimal here to allow lock.
```

### `Truth_policy.md`  *(replace with your final doc before locking)*

```md
# Truth Policy (replace with your finalized policy)
# Immutable contract for preflight lock.
```

---

## Lock & Preflight

### `scripts/preflight.js`

```js
import fs from "fs";
import crypto from "crypto";

const mustExist = ["Master_file.md","Truth_policy.md","docs/.truth_lock.json"];
for (const p of mustExist) {
  if (!fs.existsSync(p)) {
    console.error(`[PRE-FLIGHT] Missing required file: ${p}`);
    process.exit(1);
  }
}

const lock = JSON.parse(fs.readFileSync("docs/.truth_lock.json","utf-8"));
const hash = (path)=>crypto.createHash("sha256").update(fs.readFileSync(path)).digest("hex");
const current = {
  master: hash("Master_file.md"),
  truth: hash("Truth_policy.md")
};
if (current.master !== lock.master || current.truth !== lock.truth) {
  console.error("[PRE-FLIGHT] Master_file.md or Truth_policy.md changed! Update lock or revert.");
  process.exit(1);
}

const scanPaths = ["src","scripts"];
const bad = [];
const scan = (dir)=>{
  for (const f of fs.readdirSync(dir)) {
    const p = `${dir}/${f}`;
    const st = fs.statSync(p);
    if (st.isDirectory()) scan(p);
    else {
      const txt = fs.readFileSync(p,"utf-8");
      if (txt.includes("TODO") || txt.trim() === "") bad.push(p);
    }
  }
};
for (const s of scanPaths) if (fs.existsSync(s)) scan(s);
if (bad.length) {
  console.error("[PRE-FLIGHT] Empty files or TODO markers found:\n" + bad.join("\n"));
  process.exit(1);
}
console.log("[PRE-FLIGHT] OK");
```

### `scripts/initTruthLock.js`

```js
import fs from "fs";
import crypto from "crypto";

if (!fs.existsSync("Master_file.md") || !fs.existsSync("Truth_policy.md")) {
  console.error("Add Master_file.md and Truth_policy.md first.");
  process.exit(1);
}
const hash = (path)=>crypto.createHash("sha256").update(fs.readFileSync(path)).digest("hex");
const lock = { master: hash("Master_file.md"), truth: hash("Truth_policy.md") };
if (!fs.existsSync("docs")) fs.mkdirSync("docs");
fs.writeFileSync("docs/.truth_lock.json", JSON.stringify(lock,null,2));
console.log("Locked Truth & Master files. Guard enabled.");
```

---

## Server + Middleware

### `src/index.js`

```js
import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { releaseNotesRouter } from "./routes/releaseNotes.js";
import { incidentRouter } from "./routes/incidents.js";
import { securityHeaders } from "./middleware/securityHeaders.js";
import { obsMiddleware } from "./middleware/observability.js";
import { dlpMiddleware } from "./middleware/dlp.js";
import { tenantMiddleware } from "./middleware/tenant.js";
import { requireRole } from "./middleware/rbac.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(securityHeaders);
app.use(obsMiddleware);
app.use(tenantMiddleware);
app.use(dlpMiddleware);

app.get("/", (_req,res)=>res.json({ok:true, msg:"Worldclass SDLC Suite"}));
app.use("/release-notes", requireRole("viewer"), releaseNotesRouter);
app.use("/incidents", requireRole("viewer"), incidentRouter);

app.use("/ui", express.static(path.join(__dirname,"../public")));

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log(`Server on http://localhost:${PORT}`));
```

### `src/middleware/securityHeaders.js`  *(Phase 14)*

```js
export function securityHeaders(_req,res,next){
  res.set({
    "X-Content-Type-Options":"nosniff",
    "X-Frame-Options":"DENY",
    "X-XSS-Protection":"0",
    "Referrer-Policy":"no-referrer",
    "Permissions-Policy":"interest-cohort=()",
    "Content-Security-Policy":"default-src 'none'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'"
  });
  next();
}
```

### `src/middleware/observability.js`  *(Phase 8)*

```js
function rid(){ return Math.random().toString(36).slice(2) + Date.now().toString(36); }
export function obsMiddleware(req,res,next){
  const start = Date.now();
  const requestId = req.headers["x-request-id"] || rid();
  res.setHeader("x-request-id", requestId);
  res.on("finish", ()=>{
    const ms = Date.now()-start;
    const log = {
      t:new Date().toISOString(),
      rid:requestId,
      method:req.method,
      path:req.path,
      status:res.statusCode,
      ms
    };
    console.log(JSON.stringify(log));
  });
  next();
}
```

### `src/middleware/dlp.js`  *(Phase 10)*

```js
const emailRe = /([a-z0-9._%+-]+)@([a-z0-9.-]+)\.([a-z]{2,})/ig;
const phoneRe = /\b(\+?\d[\d\s-]{7,}\d)\b/g;
const panRe = /\b([A-Z]{5}\d{4}[A-Z])\b/g; // India PAN example

export function maskPII(text=""){
  return text
    .replace(emailRe, "***@***.***")
    .replace(phoneRe, "***-PII-PHONE-REDACTED***")
    .replace(panRe, "***-PII-PAN-REDACTED***");
}
export function dlpMiddleware(req,res,next){
  const oldJson = res.json.bind(res);
  const oldSend = res.send.bind(res);
  res.json = (body)=>{
    if (typeof body === "string") return oldJson(maskPII(body));
    if (typeof body === "object") return oldJson(JSON.parse(maskPII(JSON.stringify(body))));
    return oldJson(body);
  };
  res.send = (body)=>{
    if (typeof body === "string") return oldSend(maskPII(body));
    return oldSend(body);
  };
  next();
}
```

### `src/middleware/tenant.js`  *(Phase 12)*

```js
export function tenantMiddleware(req,_res,next){
  const t = req.headers["x-tenant-id"] || "default";
  req.tenantId = String(t);
  next();
}
```

### `src/middleware/rbac.js`  *(Phase 7)*

```js
const roleHierarchy = ["viewer","maintainer","admin","auditor"];

function hasRole(userRoles, required){
  const maxUser = Math.max(...userRoles.map(r=>roleHierarchy.indexOf(r)).filter(x=>x>=0));
  const need = roleHierarchy.indexOf(required);
  return maxUser >= need;
}

export function requireRole(required="viewer"){
  return (req,res,next)=>{
    const hdr = String(req.headers["x-user-roles"]||"viewer");
    const roles = hdr.split(",").map(s=>s.trim());
    if (!hasRole(roles, required)) return res.status(403).json({ok:false, error:"forbidden"});
    next();
  };
}
```

---

## Minimal UI

### `public/index.html`  *(Phase 16)*

```html
<!doctype html>
<html lang="en">
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Worldclass SDLC Suite</title>
<style>
body{font-family:ui-sans-serif,system-ui;max-width:900px;margin:32px auto;padding:0 16px}
.card{border:1px solid #ddd;border-radius:12px;margin:14px 0;padding:12px}
pre{background:#0b0f14;color:#e6edf3;padding:12px;border-radius:8px;overflow:auto}
a.btn{display:inline-block;padding:8px 12px;border:1px solid #ccc;border-radius:8px;text-decoration:none}
</style>
<h1>Worldclass SDLC Suite</h1>
<div class="card">
  <h3>Release Notes (Markdown)</h3>
  <a class="btn" href="/release-notes" target="_blank">Open</a>
</div>
<div class="card">
  <h3>Incidents</h3>
  <a class="btn" href="/incidents" target="_blank">Open</a>
</div>
</html>
```

---

## Phase 1 — Release Notes Composer (Local/Mock)

### `src/modules/releaseNotes.js`

```js
import fs from "fs";

export function loadJSON(path) {
  return JSON.parse(fs.readFileSync(path, "utf-8"));
}

export function classifyFeature(title, labels) {
  const lower = title.toLowerCase();
  if (labels?.some(l=>l.includes("authentication")) || lower.includes("auth")) return "Authentication";
  if (labels?.some(l=>l.includes("payments")) || lower.includes("payment")) return "Payments";
  return "Core";
}

export function riskTag(commits) {
  const txt = commits.map(c=>c.message.toLowerCase()).join(" ");
  if (txt.includes("breaking change")) return "Risk: Breaking Change";
  if (txt.includes("perf") || txt.includes("latency")) return "Risk: Performance Impact";
  if (txt.includes("fix")) return "Risk: Minor Fix";
  return "Risk: None Detected";
}

export function linkJira(pr, jiraMap) {
  return (pr.jira_keys||[]).map(k => jiraMap[k]).filter(Boolean);
}

export function generateMarkdown(prs, jiraMap) {
  const groups = {};
  for (const pr of prs) {
    const feature = classifyFeature(pr.title, pr.labels);
    const risk = riskTag(pr.commits);
    const linked = linkJira(pr, jiraMap);
    groups[feature] ||= [];
    groups[feature].push({ pr, risk, linked });
  }
  let out = "## Release Notes (Local Mock)\n\n";
  for (const feature of Object.keys(groups)) {
    out += `### ${feature}\n`;
    for (const item of groups[feature]) {
      const { pr, risk, linked } = item;
      const jiraStr = linked.map(j=>`${j.key}: ${j.summary} [${j.status}]`).join("; ") || "None";
      const commits = pr.commits.map(c=>c.message).join(" | ");
      out += `- PR #${pr.pr_number} — ${pr.title}\n  - Commits: ${commits}\n  - JIRA: ${jiraStr}\n  - ${risk}\n`;
    }
    out += "\n";
  }
  return out.trim()+"\n";
}
```

### `src/routes/releaseNotes.js`

```js
import { Router } from "express";
import { loadJSON, generateMarkdown } from "../modules/releaseNotes.js";
import { aiSummarize } from "../integrations/azureAi.js";
import { teamsWebhookCard, makeReleaseNotesCard } from "../integrations/teams.js";
import { ensureConnection, setSchema, upsertItem } from "../integrations/graphConnectors.js";

export const releaseNotesRouter = Router();

releaseNotesRouter.get("/", async (_req,res)=>{
  const prs = loadJSON("data/mock_prs.json");
  const jira = loadJSON("data/mock_jira.json");
  const md = generateMarkdown(prs, jira);
  const summary = await aiSummarize(md, "Summarize as customer-facing notes.");
  await teamsWebhookCard(makeReleaseNotesCard({ title:"Release Notes (Local)", markdown: summary }));
  try {
    await ensureConnection(); await setSchema();
    await upsertItem("rn-local", { type:"release-note", title:"Local Demo", module:"Mixed", risk:"None", url:"", contentMd: summary });
  } catch { /* skip if not configured */ }
  res.type("text/markdown").send(summary);
});
```

### `data/mock_prs.json`

```json
[
  {
    "pr_number": 123,
    "title": "feat(auth): add login flow and session refresh",
    "merged_at": "2025-08-09T12:00:00Z",
    "labels": ["feature/authentication"],
    "commits": [
      {"sha":"a1b2c3","message":"feat(auth): implement login"},
      {"sha":"d4e5f6","message":"fix(auth): refresh token bug"}
    ],
    "jira_keys": ["AUTH-456"]
  },
  {
    "pr_number": 124,
    "title": "fix(payments): gateway retry and timeout",
    "merged_at": "2025-08-10T12:00:00Z",
    "labels": ["bug/payments"],
    "commits": [
      {"sha":"g7h8i9","message":"fix(pay): handle 502 from provider"},
      {"sha":"j0k1l2","message":"chore: add structured logging"}
    ],
    "jira_keys": ["PAY-101"]
  }
]
```

### `data/mock_jira.json`

```json
{
  "AUTH-456": { "key": "AUTH-456", "summary": "Implement secure login flow", "status": "Done", "module": "Authentication" },
  "PAY-101": { "key": "PAY-101", "summary": "Payment gateway intermittent failures", "status": "In Progress", "module": "Payments" }
}
```

### `scripts/runPhase1Demo.js`

```js
import { loadJSON, generateMarkdown } from "../src/modules/releaseNotes.js";
const prs = loadJSON("data/mock_prs.json");
const jira = loadJSON("data/mock_jira.json");
console.log(generateMarkdown(prs, jira));
```
