const $ = (id)=>document.getElementById(id);
const toast = (msg)=>{ const t=$("toast"); t.textContent=msg; t.style.display="block"; setTimeout(()=>t.style.display="none",1500); };

async function get(path, headers={}){
  const res = await fetch(path, { headers });
  if (!res.ok) throw new Error(await res.text());
  return await res.text();
}

async function getJSON(path, headers={}){
  const res = await fetch(path, { headers });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
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

// Add showProvenance to headers
function headersFromToggles(){
  const h = {};
  if ($("postTeams").checked) h["x-post-teams"]="1";
  if ($("indexGraph").checked) h["x-index-graph"]="1";
  h["x-show-provenance"] = $("showProv").checked ? "1" : "0";
  return h;
}

// Update Teams preview/post calls to pass provenance toggle via query
const provQuery = ()=> $("showProv").checked ? "1" : "0";

$("btnRNTeamsPreview").onclick = async ()=>{
  const card = await getJSON(`/teams/card?type=release-notes&provenance=${provQuery()}`);
  sessionStorage.setItem("teamsCard", JSON.stringify(card)); window.open("/ui/teams.html","_blank");
};
$("btnRNTeamsPreviewApprove").onclick = async ()=>{
  const card = await getJSON(`/teams/card?type=release-notes&approve=1&provenance=${provQuery()}`);
  sessionStorage.setItem("teamsCard", JSON.stringify(card)); window.open("/ui/teams.html","_blank");
};
$("btnINCTeamsPreview").onclick = async ()=>{
  const card = await getJSON(`/teams/card?type=incidents&provenance=${provQuery()}`);
  sessionStorage.setItem("teamsCard", JSON.stringify(card)); window.open("/ui/teams.html","_blank");
};
$("btnINCTeamsPreviewApprove").onclick = async ()=>{
  const card = await getJSON(`/teams/card?type=incidents&approve=1&provenance=${provQuery()}`);
  sessionStorage.setItem("teamsCard", JSON.stringify(card)); window.open("/ui/teams.html","_blank");
};
$("btnRNTeamsPostApprove").onclick = async ()=>{
  const r = await fetch(`/teams/post-with-approval?type=release-notes&provenance=${provQuery()}`,{method:"POST"});
  const j = await r.json(); toast(j.ok ? `Posted with approval (${j.surface})` : "Failed");
};
$("btnINCTeamsPostApprove").onclick = async ()=>{
  const r = await fetch(`/teams/post-with-approval?type=incidents&provenance=${provQuery()}`,{method:"POST"});
  const j = await r.json(); toast(j.ok ? `Posted with approval (${j.surface})` : "Failed");
};

// Feature map editor
$("btnLoadMap").onclick = async ()=>{
  const j = await getJSON("/config/feature-map");
  $("mapEditor").value = JSON.stringify(j, null, 2);
  $("mapStatus").textContent = "loaded";
};
$("btnSaveMap").onclick = async ()=>{
  try {
    const obj = JSON.parse($("mapEditor").value);
    const r = await fetch("/config/feature-map",{ method:"PUT", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(obj) });
    $("mapStatus").textContent = r.ok ? "saved" : "save failed";
    toast(r.ok ? "Mapping saved" : "Save failed");
  } catch {
    $("mapStatus").textContent = "invalid JSON";
    toast("Invalid JSON");
  }
};

// Checklist
$("btnChecklist").onclick = async ()=>{
  const j = await getJSON("/api-diff/checklist");
  $("outChecklist").textContent = JSON.stringify(j, null, 2);
  toast("Checklist generated");
};
$("btnChecklistJira").onclick = async ()=>{
  const parent = $("jiraParent").value.trim();
  if (!parent) { toast("Enter parent issue key"); return; }
  const r = await fetch("/api-diff/checklist/jira",{ method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ parentKey: parent })});
  const j = await r.json();
  $("outChecklist").textContent = JSON.stringify(j, null, 2);
  toast(j.ok ? "JIRA subtasks created (or simulated)" : "Failed");
};

// Phase 6: Truth Audit & Demo Data
$("btnAudit").onclick = async ()=>{
  const j = await getJSON("/audit/truth");
  $("outAudit").textContent = JSON.stringify(j,null,2);
  toast(j.ok ? "Audit passed" : "Audit failed");
};
$("btnAuditStrict").onclick = async ()=>{
  const j = await getJSON("/audit/truth?strict=1");
  $("outAudit").textContent = JSON.stringify(j,null,2);
  toast(j.ok ? "Strict audit passed" : "Strict audit failed");
};
$("btnSeed").onclick = async ()=>{
  const r = await fetch("/demo/seed", { method:"POST" });
  toast(r.ok ? "Seeded demo data" : "Seed failed");
};
