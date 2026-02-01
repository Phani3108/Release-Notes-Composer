# MVP Phase — 10-Day Sprint Plan & Delta Pack

This file contains the full plan and copy-paste code to extend your Worldclass SDLC Suite for a judge-ready MVP, reusing all existing modules and classes. No new core classes are introduced; all features are added via new files, endpoints, and UI.

---

## 🗓️ 10-Day Sprint Plan

**Day 1–2 (UI):** Dashboard + pages for Release Notes, Incidents, API Diff, Cost Drift, Agent Auditor.
**Day 3 (SSE):** Live log stream for “Generate” actions.
**Day 4–5 (Agentic AI):** YAML playbooks that chain your modules (no new classes) + one-click run.
**Day 6 (MCP):** Minimal MCP server exposing your tools over JSON-RPC (stdio).
**Day 7 (Teams/Graph toggles):** UI switches to post to Teams / index in Graph (uses your integrations).
**Day 8 (Metrics):** `/metrics` (Prometheus text) + simple counters.
**Day 9 (Polish):** Dark mode, loading spinners, copy buttons, error banners.
**Day 10 (Demo script):** One command to generate a “What changed for me?” executive brief.

---

## ⚙️ Delta Pack — Code to Paste

### 0) Update `package.json` (add scripts)

```json
{
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
    "phase:6": "npm run check:preflight && node scripts/runPhase6Audit.js",

    "agent:run": "node scripts/runAgenticPlaybook.js",
    "mcp:server": "node scripts/runMCPServer.js",
    "demo:brief": "node scripts/generateDemoBrief.js"
  }
}
```

---

### 1) Frontend (vanilla) — `public/dashboard.html` + `public/app.js`

#### `public/dashboard.html`

```html
<!doctype html>
<html lang="en">
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Worldclass SDLC Suite — Dashboard</title>
<style>
:root{--bg:#0b0f14;--fg:#e6edf3;--muted:#9fb3c8;--card:#101722;--b:#223042;--acc:#7ee787;}
*{box-sizing:border-box} body{margin:0;background:var(--bg);color:var(--fg);font-family:ui-sans-serif,system-ui}
header{padding:16px 20px;border-bottom:1px solid var(--b);display:flex;gap:12px;align-items:center}
h1{font-size:18px;margin:0} .pill{border:1px solid var(--b);padding:6px 10px;border-radius:999px;color:var(--muted);}
main{max-width:1100px;margin:0 auto;padding:20px} .grid{display:grid;gap:16px;grid-template-columns:repeat(12,1fr)}
.card{grid-column:span 6;background:var(--card);border:1px solid var(--b);border-radius:12px;padding:14px}
.card h3{margin:0 0 8px 0;font-size:16px}
.btn{border:1px solid var(--b);background:#0f1b2a;color:var(--fg);padding:6px 10px;border-radius:8px;cursor:pointer}
.btn:hover{border-color:#355070} pre{background:#0a0f16;border:1px solid var(--b);padding:10px;border-radius:8px;overflow:auto;max-height:240px}
.row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.badge{display:inline-block;padding:2px 6px;border:1px solid var(--b);border-radius:6px;color:#9dd6ff;font-size:12px}
label{font-size:12px;color:var(--muted)} input[type=checkbox]{transform:scale(1.1)}
#toast{position:fixed;right:16px;bottom:16px;background:#07141f;border:1px solid var(--b);color:var(--fg);padding:8px 12px;border-radius:8px;display:none}
textarea{width:100%;height:120px;background:#0a0f16;color:var(--fg);border:1px solid var(--b);border-radius:8px;padding:8px}
</style>
<header>
  <h1>Worldclass SDLC Suite</h1>
  <span class="pill">Local-first</span>
  <span class="pill">Agentic</span>
  <span class="pill">MCP</span>
</header>
<main class="grid">
  <section class="card" style="grid-column: span 12">
    <div class="row">
      <button class="btn" id="btnRN">Generate Release Notes</button>
      <button class="btn" id="btnINC">Show Incidents</button>
      <button class="btn" id="btnAPI">API Diff Demo</button>
      <button class="btn" id="btnCOST">Cost Report</button>
      <button class="btn" id="btnAGENT">Run Agentic Playbook</button>
      <button class="btn" id="btnBRIEF">Generate Exec Brief</button>
      <label><input type="checkbox" id="postTeams"/> Post to Teams</label>
      <label><input type="checkbox" id="indexGraph"/> Index in Graph</label>
    </div>
  </section>

  <section class="card"><h3>Release Notes</h3><pre id="outRN">—</pre></section>
  <section class="card"><h3>Incidents</h3><pre id="outINC">—</pre></section>
  <section class="card"><h3>API Diff</h3><pre id="outAPI">—</pre></section>
  <section class="card"><h3>Cost Drift</h3><pre id="outCOST">—</pre></section>
  <section class="card" style="grid-column: span 12">
    <h3>Agentic Log <span class="badge">SSE live</span></h3>
    <pre id="outLOG">—</pre>
  </section>
  <section class="card" style="grid-column: span 12">
    <h3>Exec Brief (Markdown)</h3>
    <textarea id="outBRIEF" placeholder="Click 'Generate Exec Brief'"></textarea>
  </section>
</main>
<div id="toast"></div>
<script src="/ui/app.js"></script>
</html>
```

#### `public/app.js`

```js
const $ = (id)=>document.getElementById(id);
const toast = (msg)=>{ const t=$("toast"); t.textContent=msg; t.style.display="block"; setTimeout(()=>t.style.display="none",1500); };

async function get(path, headers={}){
  const res = await fetch(path, { headers });
  if (!res.ok) throw new Error(await res.text());
  return await res.text();
}

$("btnRN").onclick = async ()=>{
  const headers = {};
  if ($("postTeams").checked) headers["x-post-teams"]="1";
  if ($("indexGraph").checked) headers["x-index-graph"]="1";
  const md = await get("/release-notes", headers);
  $("outRN").textContent = md;
  toast("Release notes ready");
};

$("btnINC").onclick = async ()=>{
  const md = await get("/incidents");
  $("outINC").textContent = md;
  toast("Incidents loaded");
};

$("btnAPI").onclick = async ()=>{
  const txt = await get("/api-diff/demo");
  $("outAPI").textContent = txt;
  toast("API diff computed");
};

$("btnCOST").onclick = async ()=>{
  const txt = await get("/cost/drift");
  $("outCOST").textContent = txt;
  toast("Cost drift report ready");
};

$("btnAGENT").onclick = async ()=>{
  // Kick agentic run; logs will stream via SSE
  await fetch("/agentic/run", { method:"POST" });
  toast("Agentic playbook started");
};

$("btnBRIEF").onclick = async ()=>{
  const md = await get("/demo/brief");
  $("outBRIEF").value = md;
  toast("Executive brief generated");
};

// SSE logs
(function(){
  const ev = new EventSource("/events");
  ev.onmessage = (e)=>{
    const cur = $("outLOG").textContent === "—" ? "" : $("outLOG").textContent + "\n";
    $("outLOG").textContent = cur + e.data;
  };
})();
```

---

### 2) Server additions (SSE, simple routes that reuse your modules)

#### Patch `src/index.js` (append near other routes)

```js
// SSE (Server-Sent Events)
const clients = new Set();
app.get("/events", (req,res)=>{
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
  });
  res.write("retry: 2000\n\n");
  clients.add(res);
  req.on("close", ()=>clients.delete(res));
});
function logSSE(line){ for (const c of clients) c.write(`data: ${line}\n\n`); }
app.set("sseLog", logSSE);

// Lightweight helper to honor UI toggles (Teams/Graph) without new classes
app.use((req,_res,next)=>{
  req.flags = {
    postTeams: req.headers["x-post-teams"]==="1",
    indexGraph: req.headers["x-index-graph"]==="1"
  };
  next();
});

// Demo helper routes
import { demoRouter } from "./routes/demo.js";
import { apiDiffRouter } from "./routes/apiDiff.js";
import { costRouter } from "./routes/cost.js";
import { agenticRouter } from "./routes/agentic.js";
import { metricsRouter } from "./routes/metrics.js";

app.use("/demo", demoRouter);
app.use("/api-diff", apiDiffRouter);
app.use("/cost", costRouter);
app.use("/agentic", agenticRouter);
app.use("/metrics", metricsRouter);
```

---

### 3) New small routers (reuse existing modules)

#### `src/routes/apiDiff.js`

```js
import { Router } from "express";
import fs from "fs";
import { diffOpenAPI } from "../modules/openapiDiff.js";
export const apiDiffRouter = Router();

apiDiffRouter.get("/demo", (_req,res)=>{
  const before = {
    openapi:"3.0.0",
    paths:{"/users":{"get":{}}},"/payments":{"post":{}} },
    components:{schemas:{User:{properties:{email:{type:"string"},id:{type:"string"}}}}}
  };
  const after = {
    openapi:"3.0.0",
    paths:{"/users":{"get":{}} },
    components:{schemas:{User:{properties:{id:{type:"string"}}}}}
  };
  fs.writeFileSync("data/openapi_before.json", JSON.stringify(before,null,2));
  fs.writeFileSync("data/openapi_after.json", JSON.stringify(after,null,2));
  const r = diffOpenAPI("data/openapi_before.json","data/openapi_after.json");
  res.type("application/json").send(JSON.stringify(r,null,2));
});
```

#### `src/routes/cost.js`

```js
import { Router } from "express";
import { findAnomalies, findIdleCandidates, formatTeamsCard } from "../modules/costDrift.js";
export const costRouter = Router();

costRouter.get("/drift", (_req,res)=>{
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
  const out = formatTeamsCard(findAnomalies(costs,20), findIdleCandidates(util,5));
  res.type("text/plain").send(out);
});
```

#### `src/routes/demo.js` (Exec brief using your Azure/OpenAI summarizer)

```js
import { Router } from "express";
import { loadJSON, generateMarkdown } from "../modules/releaseNotes.js";
import { loadIncidents } from "../modules/incidents.js";
import { aiSummarize } from "../integrations/azureAi.js";
export const demoRouter = Router();

demoRouter.get("/brief", async (_req,res)=>{
  const prs = loadJSON("data/mock_prs.json");
  const jira = JSON.parse(JSON.stringify(require("fs").readFileSync("data/mock_jira.json","utf-8")));
  const rn = generateMarkdown(prs, JSON.parse(jira));
  const inc = loadIncidents().map(i=>`Incident: ${i.alertName} (${i.severity}) on ${i.service}`);
  const body = `# Weekly Executive Brief\n\n## Release Notes\n${rn}\n\n## Incidents\n- ${inc.join("\n-")}\n\n## Takeaways\n- Reliability trending stable\n- No PII schema changes merged\n`;
  const md = await aiSummarize(body, "Summarize into 5 crisp bullets for executives. Keep markdown.");
  res.type("text/markdown").send(md);
});
```

#### `src/routes/metrics.js` (Prometheus-style)

```js
import { Router } from "express";
let counters = { requests_total:0, rn_hits:0, inc_hits:0 };
export const metricsRouter = Router();

metricsRouter.use((_req,_res,next)=>{ counters.requests_total++; next(); });

metricsRouter.get("/", (_req,res)=>{
  const lines = [
    "# HELP requests_total Total HTTP requests",
    "# TYPE requests_total counter",
    `requests_total ${counters.requests_total}`,
    "# HELP rn_hits Release Notes hits",
    "# TYPE rn_hits counter",
    `rn_hits ${counters.rn_hits}`,
    "# HELP inc_hits Incident hits",
    "# TYPE inc_hits counter",
    `inc_hits ${counters.inc_hits}`
  ];
  res.type("text/plain").send(lines.join("\n")+"\n");
});

export function bumpRn(){ counters.rn_hits++; }
export function bumpInc(){ counters.inc_hits++; }
```

> Optionally, in your existing `releaseNotesRouter` and `incidentRouter`, import and call `bumpRn()` / `bumpInc()`.

---

### 4) Agentic AI (no new classes) — YAML playbooks + runner + route

#### `data/agent_playbooks.yaml`

```yaml
name: "Release Health Happy Path"
steps:
  - id: release_notes
    run: "release_notes"
  - id: incidents
    run: "incidents"
  - id: api_diff
    run: "api_diff"
  - id: cost_drift
    run: "cost_drift"
  - id: brief
    run: "exec_brief"
```

#### `scripts/runAgenticPlaybook.js`

```js
import fs from "fs";
import YAML from "yaml";
import { loadJSON, generateMarkdown } from "../src/modules/releaseNotes.js";
import { loadIncidents } from "../src/modules/incidents.js";
import { diffOpenAPI } from "../src/modules/openapiDiff.js";
import { findAnomalies, findIdleCandidates } from "../src/modules/costDrift.js";
import { aiSummarize } from "../src/integrations/azureAi.js";

function log(line){ console.log(line); }

const play = YAML.parse(fs.readFileSync("data/agent_playbooks.yaml","utf-8"));

for (const step of play.steps) {
  if (step.run==="release_notes"){
    const md = generateMarkdown(loadJSON("data/mock_prs.json"), JSON.parse(fs.readFileSync("data/mock_jira.json","utf-8")));
    log(`[release_notes]\n${md}`);
  } else if (step.run==="incidents"){
    const out = loadIncidents().map(i=>`${i.alertName} (${i.severity}) on ${i.service}`).join("\n");
    log(`[incidents]\n${out}`);
  } else if (step.run==="api_diff"){
    fs.writeFileSync("data/openapi_before.json", JSON.stringify({openapi:"3.0.0",paths:{"/x":{"get":{}}},components:{schemas:{U:{properties:{email:{},id:{}}}}}},null,2));
    fs.writeFileSync("data/openapi_after.json", JSON.stringify({openapi:"3.0.0",paths:{},components:{schemas:{U:{properties:{id:{}}}}}},null,2));
    const r = diffOpenAPI("data/openapi_before.json","data/openapi_after.json");
    log(`[api_diff]\n${JSON.stringify(r,null,2)}`);
  } else if (step.run==="cost_drift"){
    const costs=[{tag:"svc:auth",week:"1",cost:100},{tag:"svc:auth",week:"2",cost:140}];
    const util=[{resource:"vm-auth-1",weekly:[1,2,1,2,1]}];
    const a = findAnomalies(costs,20), i = findIdleCandidates(util,5);
    log(`[cost_drift]\nAnomalies=${a.length}, Idle=${i.length}`);
  } else if (step.run==="exec_brief"){
    const body = `Summarize the system state into 5 bullets for execs.`;
    const md = await aiSummarize(body, "Output bullet list only.");
    log(`[exec_brief]\n${md}`);
  }
}
```

#### `src/routes/agentic.js` (POST to start; logs go via SSE)

```js
import { Router } from "express";
import fs from "fs";
import YAML from "yaml";
import { loadJSON, generateMarkdown } from "../modules/releaseNotes.js";
import { loadIncidents } from "../modules/incidents.js";
import { diffOpenAPI } from "../modules/openapiDiff.js";
import { findAnomalies, findIdleCandidates } from "../modules/costDrift.js";
import { aiSummarize } from "../integrations/azureAi.js";
export const agenticRouter = Router();

agenticRouter.post("/run", async (req,res)=>{
  const log = req.app.get("sseLog") || (()=>{});
  const play = YAML.parse(fs.readFileSync("data/agent_playbooks.yaml","utf-8"));
  for (const step of play.steps) {
    if (step.run==="release_notes"){
      const md = generateMarkdown(loadJSON("data/mock_prs.json"), JSON.parse(fs.readFileSync("data/mock_jira.json","utf-8")));
      log(`[release_notes]\n${md}`);
    } else if (step.run==="incidents"){
      const out = loadIncidents().map(i=>`${i.alertName} (${i.severity}) on ${i.service}`).join("\n");
      log(`[incidents]\n${out}`);
    } else if (step.run==="api_diff"){
      fs.writeFileSync("data/openapi_before.json", JSON.stringify({openapi:"3.0.0",paths:{"/x":{"get":{}}},components:{schemas:{U:{properties:{email:{},id:{}}}}}},null,2));
      fs.writeFileSync("data/openapi_after.json", JSON.stringify({openapi:"3.0.0",paths:{},components:{schemas:{U:{properties:{id:{}}}}}},null,2));
      const r = diffOpenAPI("data/openapi_before.json","data/openapi_after.json");
      log(`[api_diff]\n${JSON.stringify(r,null,2)}`);
    } else if (step.run==="cost_drift"){
      const costs=[{tag:"svc:auth",week:"1",cost:100},{tag:"svc:auth",week:"2",cost:140}];
      const util=[{resource:"vm-auth-1",weekly:[1,2,1,2,1]}];
      const a = findAnomalies(costs,20), i = findIdleCandidates(util,5);
      log(`[cost_drift]\nAnomalies=${a.length}, Idle=${i.length}`);
    } else if (step.run==="exec_brief"){
      const md = await aiSummarize("Summarize the system state into 5 bullets for execs.","Output bullet list only.");
      log(`[exec_brief]\n${md}`);
    }
    await new Promise(r=>setTimeout(r,200)); // small pacing
  }
  res.json({ok:true});
});
```

---

### 5) Minimal MCP server (stdio JSON-RPC) — exposes your tools

#### `src/integrations/mcp.js`

```js
// Minimal MCP-like JSON-RPC server over stdio for demo purposes.
// Tools: release_notes, incidents, api_diff, cost_drift
import fs from "fs";
import { loadJSON, generateMarkdown } from "../modules/releaseNotes.js";
import { loadIncidents } from "../modules/incidents.js";
import { diffOpenAPI } from "../modules/openapiDiff.js";
import { findAnomalies, findIdleCandidates } from "../modules/costDrift.js";

function respond(id, result){ process.stdout.write(JSON.stringify({jsonrpc:"2.0", id, result})+"\n"); }
function error(id, code, msg){ process.stdout.write(JSON.stringify({jsonrpc:"2.0", id, error:{code, message:msg}})+"\n"); }

function listTools(){
  return [
    { name:"release_notes", description:"Generate release notes markdown" },
    { name:"incidents", description:"List current incidents markdown" },
    { name:"api_diff", description:"OpenAPI diff (demo data)" },
    { name:"cost_drift", description:"Cost drift/idle suspects (demo)" }
  ];
}

function callTool(name, params={}){
  if (name==="release_notes"){
    return generateMarkdown(loadJSON("data/mock_prs.json"), JSON.parse(fs.readFileSync("data/mock_jira.json","utf-8")));
  }
  if (name==="incidents"){
    return loadIncidents().map(i=>`${i.alertName} (${i.severity}) on ${i.service}`).join("\n");
  }
  if (name==="api_diff"){
    fs.writeFileSync("data/openapi_before.json", JSON.stringify({openapi:"3.0.0",paths:{"/x":{"get":{}}},components:{schemas:{U:{properties:{email:{},id:{}}}}}},null,2));
    fs.writeFileSync("data/openapi_after.json", JSON.stringify({openapi:"3.0.0",paths:{},components:{schemas:{U:{properties:{id:{}}}}}},null,2));
    return diffOpenAPI("data/openapi_before.json","data/openapi_after.json");
  }
  if (name==="cost_drift"){
    const costs=[{tag:"svc:auth",week:"1",cost:100},{tag:"svc:auth",week:"2",cost:140}];
    const util=[{resource:"vm-auth-1",weekly:[1,2,1,2,1]}];
    return { anomalies: findAnomalies(costs,20), idle: findIdleCandidates(util,5) };
  }
  throw new Error("Unknown tool");
}

export function handleLine(line){
  try {
    const msg = JSON.parse(line);
    if (msg.method==="tools/list") return respond(msg.id, listTools());
    if (msg.method==="tools/call") return respond(msg.id, callTool(msg.params?.name, msg.params?.args));
    return error(msg.id, -32601, "Method not found");
  } catch(e){ error(null, -32700, "Parse error"); }
}
```

#### `scripts/runMCPServer.js`

```js
import readline from "readline";
import { handleLine } from "../src/integrations/mcp.js";

const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
rl.on("line", handleLine);
console.error("MCP server (demo) ready on stdio");
```

**Try it**:

```bash
npm run mcp:server
# In another shell:
node -e 'const cp=require("child_process").spawn("node",["scripts/runMCPServer.js"]); cp.stdout.on("data",d=>console.log(d.toString())); cp.stdin.write(JSON.stringify({jsonrpc:"2.0",id:1,method:"tools/list"})+"\n"); cp.stdin.write(JSON.stringify({jsonrpc:"2.0",id:2,method:"tools/call",params:{name:"release_notes"}})+"\n");'
```

---

### 6) Demo brief generator (polish for judges)

#### `scripts/generateDemoBrief.js`

```js
import { loadJSON, generateMarkdown } from "../src/modules/releaseNotes.js";
import { loadIncidents } from "../src/modules/incidents.js";
import { aiSummarize } from "../src/integrations/azureAi.js";
const prs = loadJSON("data/mock_prs.json");
const jira = JSON.parse(require("fs").readFileSync("data/mock_jira.json","utf-8"));
const rn = generateMarkdown(prs, jira);
const inc = loadIncidents().map(i=>`- ${i.alertName} (${i.severity}) on ${i.service}`).join("\n");
const draft = `# Demo Brief\n## Highlights\n- Ship-ready RN composer\n- Incident explainer\n- API gatekeeper & cost drift\n## Release Notes\n${rn}\n## Incidents\n${inc}\n`;
const md = await aiSummarize(draft, "Summarize for judges in 6 bullets. Keep markdown.");
console.log(md);
```

---

## ✅ What you now have

* **Front-end dashboard** (no frameworks) that triggers your existing modules and shows results.
* **Live logs** via SSE for the agentic run.
* **Agentic playbooks** (YAML) chaining your existing functions — no new classes.
* A **minimal MCP server** so you can say “MCP compatible tools” in the demo.
* **/metrics** endpoint for quick observability.
* A **demo brief** generator for judges.

---

Paste each code block into the corresponding file/folder. Implement features one by one as planned. No new function classes are needed; all logic reuses your existing modules.

If you want a file-by-file PR plan, just ask!

---

# Frontend + Teams Enhancements (Delta Pack)

> Scope: Only adds UI, routes, and small helpers inside existing folders (`public/`, `src/routes/`, `src/integrations/`).
> Core modules remain the same (ReleaseNotes, Incidents, Gatekeeper, CostDrift, Auditor).
> Toggle posting to Teams / indexing to Graph **from the UI**.

---

## 0) package.json — add scripts (if not there)

```json
{
  "scripts": {
    "dev": "node src/index.js",
    "check:preflight": "node scripts/preflight.js",
    "lock:truth": "node scripts/initTruthLock.js",

    "agent:run": "node scripts/runAgenticPlaybook.js",
    "mcp:server": "node scripts/runMCPServer.js",
    "demo:brief": "node scripts/generateDemoBrief.js"
  }
}
```

---

## 1) Public UI

### `public/dashboard.html` (replace/upgrade your current one)

```html
<!doctype html>
<html lang="en">
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Worldclass SDLC Suite — Dashboard</title>
<link rel="stylesheet" href="/ui/styles.css"/>
<header>
  <h1>Worldclass SDLC Suite</h1>
  <span class="pill">Local-first</span>
  <span class="pill">Agentic</span>
  <span class="pill">MCP</span>
</header>

<main class="grid">
  <section class="card span-12">
    <div class="row">
      <label class="switch"><input type="checkbox" id="postTeams"><span>Post to Teams</span></label>
      <label class="switch"><input type="checkbox" id="indexGraph"><span>Index in Graph</span></label>
      <a class="btn" href="/metrics" target="_blank">Open /metrics</a>
      <a class="btn" href="/events" target="_blank">Open SSE (raw)</a>
      <a class="btn" href="/ui/teams.html" target="_blank">Open Teams Preview</a>
    </div>
  </section>

  <!-- Release Notes -->
  <section class="card">
    <h3>Release Notes</h3>
    <div class="row">
      <button class="btn" id="btnRN">Generate</button>
      <div class="drop">
        <button class="btn">Export ▾</button>
        <div class="menu">
          <button data-exp="rn:md">Markdown (.md)</button>
          <button data-exp="rn:html">HTML (.html)</button>
          <button data-exp="rn:json">JSON (.json)</button>
        </div>
      </div>
      <button class="btn" id="btnRNTeamsPreview">Teams Preview</button>
      <button class="btn" id="btnRNTeamsPost">Post to Teams</button>
      <button class="btn" id="btnRNCopy">Copy</button>
    </div>
    <pre id="outRN">—</pre>
  </section>

  <!-- Incidents -->
  <section class="card">
    <h3>Incidents</h3>
    <div class="row">
      <button class="btn" id="btnINC">Show</button>
      <div class="drop">
        <button class="btn">Export ▾</button>
        <div class="menu">
          <button data-exp="inc:md">Markdown (.md)</button>
          <button data-exp="inc:html">HTML (.html)</button>
          <button data-exp="inc:json">JSON (.json)</button>
        </div>
      </div>
      <button class="btn" id="btnINCTeamsPreview">Teams Preview</button>
      <button class="btn" id="btnINCTeamsPost">Post to Teams</button>
      <button class="btn" id="btnINCCopy">Copy</button>
    </div>
    <pre id="outINC">—</pre>
  </section>

  <!-- API Diff -->
  <section class="card">
    <h3>API Diff (OpenAPI)</h3>
    <div class="row">
      <button class="btn" id="btnAPI">Run Demo</button>
      <div class="drop">
        <button class="btn">Export ▾</button>
        <div class="menu">
          <button data-exp="api:json">JSON (.json)</button>
          <button data-exp="api:html">HTML (.html)</button>
        </div>
      </div>
      <button class="btn" id="btnAPICopy">Copy</button>
    </div>
    <pre id="outAPI">—</pre>
  </section>

  <!-- Cost Drift -->
  <section class="card">
    <h3>Cost Drift (FinOps)</h3>
    <div class="row">
      <button class="btn" id="btnCOST">Compute</button>
      <div class="drop">
        <button class="btn">Export ▾</button>
        <div class="menu">
          <button data-exp="cost:txt">Text (.txt)</button>
          <button data-exp="cost:html">HTML (.html)</button>
          <button data-exp="cost:json">JSON (.json)</button>
        </div>
      </div>
      <button class="btn" id="btnCOSTCopy">Copy</button>
    </div>
    <pre id="outCOST">—</pre>
  </section>

  <!-- Agentic -->
  <section class="card span-12">
    <h3>Agentic Run <span class="badge">SSE Live</span></h3>
    <div class="row">
      <button class="btn" id="btnAGENT">Run Playbook</button>
    </div>
    <pre id="outLOG">—</pre>
  </section>

  <!-- Exec Brief -->
  <section class="card span-12">
    <h3>Executive Brief</h3>
    <div class="row">
      <button class="btn" id="btnBRIEF">Generate</button>
      <div class="drop">
        <button class="btn">Export ▾</button>
        <div class="menu">
          <button data-exp="brief:md">Markdown (.md)</button>
          <button data-exp="brief:html">HTML (.html)</button>
        </div>
      </div>
    </div>
    <textarea id="outBRIEF" placeholder="Click Generate"></textarea>
  </section>
</main>

<div id="toast"></div>
<script src="/ui/app.js"></script>
```

### `public/styles.css`

```css
:root{--bg:#0b0f14;--fg:#e6edf3;--muted:#9fb3c8;--card:#101722;--b:#223042;--acc:#7ee787;}
*{box-sizing:border-box} body{margin:0;background:var(--bg);color:var(--fg);font-family:ui-sans-serif,system-ui}
header{padding:16px 20px;border-bottom:1px solid var(--b);display:flex;gap:12px;align-items:center}
h1{font-size:18px;margin:0} .pill{border:1px solid var(--b);padding:6px 10px;border-radius:999px;color:var(--muted);}
main{max-width:1100px;margin:0 auto;padding:20px} .grid{display:grid;gap:16px;grid-template-columns:repeat(12,1fr)}
.span-12{grid-column:span 12}
.card{grid-column:span 6;background:var(--card);border:1px solid var(--b);border-radius:12px;padding:14px}
.card h3{margin:0 0 8px 0;font-size:16px}
.row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.badge{display:inline-block;padding:2px 6px;border:1px solid var(--b);border-radius:6px;color:#9dd6ff;font-size:12px}
.btn{border:1px solid var(--b);background:#0f1b2a;color:var(--fg);padding:6px 10px;border-radius:8px;cursor:pointer}
.btn:hover{border-color:#355070}
pre{background:#0a0f16;border:1px solid var(--b);padding:10px;border-radius:8px;overflow:auto;max-height:260px;white-space:pre-wrap}
textarea{width:100%;height:160px;background:#0a0f16;color:var(--fg);border:1px solid var(--b);border-radius:8px;padding:8px}
.switch{display:flex;gap:6px;align-items:center;color:var(--muted)}
#toast{position:fixed;right:16px;bottom:16px;background:#07141f;border:1px solid var(--b);color:var(--fg);padding:8px 12px;border-radius:8px;display:none}
.drop{position:relative} .drop .menu{display:none;position:absolute;z-index:5;background:#0a0f16;border:1px solid var(--b);border-radius:8px;min-width:160px}
.drop:hover .menu{display:block}
.drop .menu button{display:block;width:100%;text-align:left;padding:8px 10px;background:transparent;border:0;color:var(--fg);cursor:pointer}
.drop .menu button:hover{background:#0f1b2a}
```

### `public/app.js`

```js
const $ = (id)=>document.getElementById(id);
const toast = (msg)=>{ const t=$("toast"); t.textContent=msg; t.style.display="block"; setTimeout(()=>t.style.display="none",1500); };

async function fetchText(path, headers={}){
  const res = await fetch(path, { headers });
  if (!res.ok) throw new Error(await res.text());
  return await res.text();
}
async function fetchJson(path, headers={}){
  const res = await fetch(path, { headers });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}
function dl(name, mime, text){
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text],{type:mime}));
  a.download = name; a.click(); URL.revokeObjectURL(a.href);
}

// Toggle headers
function hdrs(){
  const h = {};
  if ($("postTeams").checked) h["x-post-teams"]="1";
  if ($("indexGraph").checked) h["x-index-graph"]="1";
  return h;
}

// Release Notes
$("btnRN").onclick = async ()=>{
  const md = await fetchText("/release-notes", hdrs());
  $("outRN").textContent = md; toast("Release notes ready");
};
$("btnRNCopy").onclick = ()=>{ navigator.clipboard.writeText($("outRN").textContent); toast("Copied"); };
$("btnRNTeamsPreview").onclick = async ()=>{
  const card = await fetchJson("/teams/card?type=release-notes");
  sessionStorage.setItem("teamsCard", JSON.stringify(card));
  window.open("/ui/teams.html","_blank");
};
$("btnRNTeamsPost").onclick = async ()=>{
  const card = await fetchJson("/teams/card?type=release-notes");
  const res = await fetch("/teams/post-card", { method:"POST", headers:{ "Content-Type":"application/json" }, body:JSON.stringify(card) });
  toast(res.ok ? "Posted to Teams" : "Teams post failed");
};

// Incidents
$("btnINC").onclick = async ()=>{
  $("outINC").textContent = await fetchText("/incidents", hdrs());
  toast("Incidents loaded");
};
$("btnINCCopy").onclick = ()=>{ navigator.clipboard.writeText($("outINC").textContent); toast("Copied"); };
$("btnINCTeamsPreview").onclick = async ()=>{
  const card = await fetchJson("/teams/card?type=incidents");
  sessionStorage.setItem("teamsCard", JSON.stringify(card));
  window.open("/ui/teams.html","_blank");
};
$("btnINCTeamsPost").onclick = async ()=>{
  const card = await fetchJson("/teams/card?type=incidents");
  const res = await fetch("/teams/post-card", { method:"POST", headers:{ "Content-Type":"application/json" }, body:JSON.stringify(card) });
  toast(res.ok ? "Posted to Teams" : "Teams post failed");
};

// API Diff
$("btnAPI").onclick = async ()=>{
  $("outAPI").textContent = await fetchText("/api-diff/demo");
  toast("API diff computed");
};
$("btnAPICopy").onclick = ()=>{ navigator.clipboard.writeText($("outAPI").textContent); toast("Copied"); };

// Cost
$("btnCOST").onclick = async ()=>{
  $("outCOST").textContent = await fetchText("/cost/drift");
  toast("Cost drift ready");
};
$("btnCOSTCopy").onclick = ()=>{ navigator.clipboard.writeText($("outCOST").textContent); toast("Copied"); };

// Agentic + SSE
$("btnAGENT").onclick = async ()=>{
  await fetch("/agentic/run",{method:"POST"});
  toast("Agentic started");
};
(function sse(){
  const ev = new EventSource("/events");
  ev.onmessage = (e)=>{
    const box = $("outLOG");
    box.textContent = (box.textContent==="—" ? "" : box.textContent+"\n") + e.data;
  };
})();

// Exec Brief
$("btnBRIEF").onclick = async ()=>{
  $("outBRIEF").value = await fetchText("/demo/brief");
  toast("Executive brief generated");
};

// Unified Export menu
document.addEventListener("click", async (e)=>{
  const exp = e.target?.dataset?.exp; if (!exp) return;
  const [kind, fmt] = exp.split(":"); let data,mime,name;
  if (kind==="rn"){
    data = await fetchText(`/export/release-notes?format=${fmt}`, hdrs());
    name = `release-notes.${fmt==="md"?"md":fmt==="html"?"html":"json"}`;
    mime = fmt==="json"?"application/json": (fmt==="html"?"text/html":"text/markdown");
  } else if (kind==="inc"){
    data = await fetchText(`/export/incidents?format=${fmt}`, hdrs());
    name = `incidents.${fmt==="md"?"md":fmt==="html"?"html":"json"}`;
    mime = fmt==="json"?"application/json": (fmt==="html"?"text/html":"text/markdown");
  } else if (kind==="api"){
    data = await fetchText(`/export/api-diff?format=${fmt}`, hdrs());
    name = `api-diff.${fmt}`;
    mime = fmt==="json"?"application/json":"text/html";
  } else if (kind==="cost"){
    data = await fetchText(`/export/cost-drift?format=${fmt}`, hdrs());
    name = `cost-drift.${fmt==="txt"?"txt":(fmt==="json"?"json":"html")}`;
    mime = fmt==="json"?"application/json": (fmt==="html"?"text/html":"text/plain");
  } else if (kind==="brief"){
    data = await fetchText(`/export/brief?format=${fmt}`, hdrs());
    name = `exec-brief.${fmt}`;
    mime = fmt==="html"?"text/html":"text/markdown";
  }
  dl(name, mime, data);
  toast(`Downloaded ${name}`);
});
```

### `public/teams.html` — Adaptive Card preview (client-side only)

```html
<!doctype html>
<html lang="en">
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Teams Card Preview</title>
<link rel="stylesheet" href="/ui/styles.css"/>
<script src="https://unpkg.com/adaptivecards/dist/adaptivecards.min.js"></script>
<main class="grid" style="max-width:800px">
  <section class="card span-12">
    <h3>Adaptive Card Preview</h3>
    <div id="cardHost"></div>
    <div class="row" style="margin-top:10px">
      <button class="btn" id="btnPost">Post to Teams</button>
      <button class="btn" id="btnCopy">Copy JSON</button>
    </div>
  </section>
</main>
<script>
  const raw = sessionStorage.getItem("teamsCard") || '{"type":"AdaptiveCard","version":"1.5","body":[{"type":"TextBlock","text":"No card","size":"Large"}]}';
  const card = JSON.parse(raw);
  const ac = new AdaptiveCards.AdaptiveCard(); ac.version = new AdaptiveCards.Version(1,5);
  ac.parse(card);
  document.getElementById("cardHost").appendChild(ac.render());
  document.getElementById("btnCopy").onclick = ()=>{ navigator.clipboard.writeText(JSON.stringify(card,null,2)); alert("Copied"); };
  document.getElementById("btnPost").onclick = async ()=>{
    const res = await fetch("/teams/post-card",{ method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(card) });
    alert(res.ok ? "Posted to Teams" : "Teams post failed");
  };
</script>
```

---

## 2) Server routes (no new classes)

### Patch `src/index.js` — ensure these routers are mounted (add if missing)

```js
// ... existing imports and middleware ...

import { demoRouter } from "./routes/demo.js";
import { apiDiffRouter } from "./routes/apiDiff.js";
import { costRouter } from "./routes/cost.js";
import { agenticRouter } from "./routes/agentic.js";
import { metricsRouter } from "./routes/metrics.js";
import { exportRouter } from "./routes/export.js";
import { teamsRouter } from "./routes/teams.js";

app.use("/demo", demoRouter);
app.use("/api-diff", apiDiffRouter);
app.use("/cost", costRouter);
app.use("/agentic", agenticRouter);
app.use("/metrics", metricsRouter);
app.use("/export", exportRouter);
app.use("/teams", teamsRouter);

// SSE already present or add:
const clients = new Set();
app.get("/events", (req,res)=>{
  res.writeHead(200, { "Content-Type":"text/event-stream","Cache-Control":"no-cache","Connection":"keep-alive" });
  res.write("retry: 2000\n\n"); clients.add(res);
  req.on("close", ()=>clients.delete(res));
});
function logSSE(line){ for (const c of clients) c.write(`data: ${line}\n\n`); }
app.set("sseLog", logSSE);
```

### Update (small) `src/routes/releaseNotes.js` and `src/routes/incidents.js` to honor UI toggles

Change the line that always posts to Teams and wrap it:

```js
// releaseNotesRouter.get("/", async (req,res)=>{ ...
if (req.flags?.postTeams) {
  await teamsWebhookCard(makeReleaseNotesCard({ title:"Release Notes (Local)", markdown: summary }));
}
```

and in incidents:

```js
if (req.flags?.postTeams) {
  await teamsWebhookPost(out);
}
```

*(This prevents accidental posts while browsing in the UI.)*

---

## 3) New tiny routers for Export + Teams

### `src/routes/export.js`

```js
import { Router } from "express";
import fs from "fs";
import { loadJSON, generateMarkdown } from "../modules/releaseNotes.js";
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

// Release Notes
exportRouter.get("/release-notes", async (req,res)=>{
  const fmt = String(req.query.format||"md");
  const prs = loadJSON("data/mock_prs.json");
  const jira = JSON.parse(fs.readFileSync("data/mock_jira.json","utf-8"));
  const md = generateMarkdown(prs, jira);
  if (fmt==="md") { res.setHeader("Content-Disposition","attachment; filename=release-notes.md"); return res.type("text/markdown").send(md); }
  if (fmt==="html") { res.setHeader("Content-Disposition","attachment; filename=release-notes.html"); return res.type("text/html").send(asHTML("Release Notes", md)); }
  if (fmt==="json") { return res.type("application/json").send(JSON.stringify({ markdown: md }, null, 2)); }
  res.status(400).send("Unsupported format");
});

// Incidents
exportRouter.get("/incidents", (req,res)=>{
  const fmt = String(req.query.format||"md");
  const out = loadIncidents().map(i=>`## ${i.alertName}\n- Service: ${i.service}\n- Severity: ${i.severity}\n- ETA: ${i.eta}\n`).join("\n");
  if (fmt==="md") { res.setHeader("Content-Disposition","attachment; filename=incidents.md"); return res.type("text/markdown").send(out); }
  if (fmt==="html") { res.setHeader("Content-Disposition","attachment; filename=incidents.html"); return res.type("text/html").send(asHTML("Incidents", out)); }
  if (fmt==="json") { return res.type("application/json").send(JSON.stringify({ incidents: loadIncidents() }, null, 2)); }
  res.status(400).send("Unsupported format");
});

// API Diff
exportRouter.get("/api-diff", (req,res)=>{
  const fmt = String(req.query.format||"json");
  fs.writeFileSync("data/openapi_before.json", JSON.stringify({openapi:"3.0.0",paths:{"/x":{"get":{}}},components:{schemas:{U:{properties:{email:{},id:{}}}}}},null,2));
  fs.writeFileSync("data/openapi_after.json", JSON.stringify({openapi:"3.0.0",paths:{},components:{schemas:{U:{properties:{id:{}}}}}},null,2));
  const diff = diffOpenAPI("data/openapi_before.json","data/openapi_after.json");
  if (fmt==="json") { res.setHeader("Content-Disposition","attachment; filename=api-diff.json"); return res.json(diff); }
  if (fmt==="html") {
    const body = [
      "Breaking:", ...diff.breaking.map(x=>" - "+x), "", "PII:", ...diff.pii.map(x=>" - "+x)
    ].join("\n");
    res.setHeader("Content-Disposition","attachment; filename=api-diff.html");
    return res.type("text/html").send(asHTML("API Diff", body));
  }
  res.status(400).send("Unsupported format");
});

// Cost Drift
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
  if (fmt==="json") {
    return res.json({
      anomalies: findAnomalies(costs,20),
      idle: findIdleCandidates(util,5)
    });
  }
  res.status(400).send("Unsupported format");
});

// Executive Brief
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
  // default md
  const md = await aiSummarize(draft, "Summarize in markdown bullets, ≤8 lines.");
  res.setHeader("Content-Disposition","attachment; filename=brief.md");
  res.type("text/markdown").send(md);
});
```

### `src/routes/teams.js`

```js
import { Router } from "express";
import { makeReleaseNotesCard, teamsWebhookCard, teamsWebhookPost } from "../integrations/teams.js";
import { loadJSON, generateMarkdown } from "../modules/releaseNotes.js";
import { loadIncidents } from "../modules/incidents.js";
import { postAdaptiveCardToChannel } from "../integrations/graphTeams.js";

export const teamsRouter = Router();

// Card factory for known types
teamsRouter.get("/card", (_req,res)=>{
  const type = String(_req.query.type||"release-notes");
  if (type==="release-notes") {
    const prs = loadJSON("data/mock_prs.json");
    const jira = JSON.parse(require("fs").readFileSync("data/mock_jira.json","utf-8"));
    const md = generateMarkdown(prs, jira);
    return res.json(makeReleaseNotesCard({ title:"Release Notes", markdown: md }));
  }
  if (type==="incidents") {
    const out = loadIncidents().map(i=>`${i.alertName} (${i.severity}) on ${i.service}`).join("\n");
    return res.json(makeReleaseNotesCard({ title:"Incidents", markdown: out }));
  }
  return res.json({ "$schema":"http://adaptivecards.io/schemas/adaptive-card.json", "type":"AdaptiveCard","version":"1.5","body":[{"type":"TextBlock","text":"Unknown type","size":"Large"}]});
});

// Post card (webhook or Graph if configured)
teamsRouter.post("/post-card", async (req,res)=>{
  const useGraph = process.env.TENANT_ID && process.env.CLIENT_ID && process.env.CLIENT_SECRET && process.env.TEAM_ID && process.env.CHANNEL_ID;
  try {
    if (useGraph) await postAdaptiveCardToChannel(req.body);
    else await teamsWebhookCard(req.body);
    res.json({ok:true});
  } catch (e) {
    console.error("Teams post failed", e?.response?.data || e?.message);
    res.status(500).json({ok:false});
  }
});
```

---

## 4) Small polish: prevent accidental Teams posts

Patch in your **existing** `src/routes/releaseNotes.js` and `src/routes/incidents.js`:

```js
// inside GET handler, before sending response:
if (req.flags?.postTeams) {
  // release notes:
  await teamsWebhookCard(makeReleaseNotesCard({ title:"Release Notes (Local)", markdown: summary }));
  // incidents:
  // await teamsWebhookPost(out);
}
```

---

## 5) What's now possible from the UI

* **One-click Generate** for each feature (Release Notes, Incidents, API Diff, Cost Drift).
* **Export** any output as **.md / .html / .json / .txt** with correct filenames and Content-Disposition headers.
* **Teams Preview** renders the actual Adaptive Card **in-browser**; **Post to Teams** uses your webhook or Graph (auto-detect).
* **Live logs** from Agentic run over SSE.
* **Metrics** endpoint link for judges.

---

## 6) Judge demo flow (60–90 seconds)

1. Open `/ui/dashboard.html`. Toggle **Post to Teams** (off for browsing, on right before posting).
2. Click **Generate Release Notes** → preview in panel.
3. Click **Export ▾** → **Markdown** (downloads `release-notes.md`).
4. Click **Teams Preview** → review Adaptive Card → **Post to Teams**.
5. Show **Incidents** → preview → **Export HTML** → **Post to Teams**.
6. Run **API Diff Demo** (shows breaking change + PII).
7. Run **Cost Drift** → export JSON.
8. Start **Agentic Playbook** → watch SSE logs.
9. Generate **Executive Brief** → export HTML → copy to clipboard.

---

## 7) Optional (but quick wins)

* Add a **"Confluence HTML"** export option that uses the `export/brief?format=html` output — many orgs paste that directly.
* To create **PDF**, use your browser's "Print to PDF" on the downloaded HTML; keeps the stack dependency-free.
