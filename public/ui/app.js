const $ = (id)=>document.getElementById(id);
const toast = (msg)=>{ const t=$("toast"); t.textContent=msg; t.style.display="block"; setTimeout(()=>t.style.display="none",1500); };

function headersFromToggles(){
  const h = {};
  if ($("postTeams").checked) h["x-post-teams"]="1";
  if ($("indexGraph").checked) h["x-index-graph"]="1";
  return h;
}
async function getText(url, headers={}){ const r = await fetch(url,{headers}); if(!r.ok) throw new Error(await r.text()); return r.text(); }
async function getJSON(url, headers={}){ const r = await fetch(url,{headers}); if(!r.ok) throw new Error(await r.text()); return r.json(); }
function download(name, type, text){ const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([text],{type})); a.download=name; a.click(); URL.revokeObjectURL(a.href); }

// Goal runner
$("btnGoal").onclick = async ()=>{
  const goal = $("goalText").value || "produce release notes";
  const res = await fetch("/agentic/goal", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ goal }) });
  const json = await res.json();
  $("outGoal").textContent = JSON.stringify(json, null, 2);
  toast("Goal run complete");
};

// Release Notes
$("btnRN").onclick = async ()=>{ $("outRN").textContent = await getText("/release-notes", headersFromToggles()); toast("Release notes ready"); };
$("btnRNCopy").onclick = ()=>{ navigator.clipboard.writeText($("outRN").textContent); toast("Copied"); };
$("btnRNTeamsPreview").onclick = async ()=>{
  const card = await getJSON("/teams/card?type=release-notes");
  sessionStorage.setItem("teamsCard", JSON.stringify(card)); window.open("/ui/teams.html","_blank");
};
$("btnRNTeamsPreviewApprove").onclick = async ()=>{
  const card = await getJSON("/teams/card?type=release-notes&approve=1");
  sessionStorage.setItem("teamsCard", JSON.stringify(card)); window.open("/ui/teams.html","_blank");
};
$("btnRNTeamsPost").onclick = async ()=>{
  const card = await getJSON("/teams/card?type=release-notes");
  const res = await fetch("/teams/post-card", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(card) });
  toast(res.ok ? "Posted to Teams" : "Teams post failed");
};

// Incidents
$("btnINC").onclick = async ()=>{ $("outINC").textContent = await getText("/incidents", headersFromToggles()); toast("Incidents loaded"); };
$("btnINCCopy").onclick = ()=>{ navigator.clipboard.writeText($("outINC").textContent); toast("Copied"); };
$("btnINCTeamsPreview").onclick = async ()=>{
  const card = await getJSON("/teams/card?type=incidents");
  sessionStorage.setItem("teamsCard", JSON.stringify(card)); window.open("/ui/teams.html","_blank");
};
$("btnINCTeamsPreviewApprove").onclick = async ()=>{
  const card = await getJSON("/teams/card?type=incidents&approve=1");
  sessionStorage.setItem("teamsCard", JSON.stringify(card)); window.open("/ui/teams.html","_blank");
};
$("btnINCTeamsPost").onclick = async ()=>{
  const card = await getJSON("/teams/card?type=incidents");
  const res = await fetch("/teams/post-card", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(card) });
  toast(res.ok ? "Posted to Teams" : "Teams post failed");
};

// Personalized RN
$("btnMyRN").onclick = async ()=>{
  const email = $("email").value.trim();
  const md = await getText(`/release-notes/my?user=${encodeURIComponent(email)}`, headersFromToggles());
  $("outMyRN").textContent = md; toast("Personalized notes ready");
};
$("btnMyCopy").onclick = ()=>{ navigator.clipboard.writeText($("outMyRN").textContent); toast("Copied"); };

// API Diff
$("btnAPI").onclick = async ()=>{ $("outAPI").textContent = await getText("/api-diff/demo"); toast("API diff computed"); };
$("btnAPICopy").onclick = ()=>{ navigator.clipboard.writeText($("outAPI").textContent); toast("Copied"); };

// Cost
$("btnCOST").onclick = async ()=>{ $("outCOST").textContent = await getText("/cost/drift"); toast("Cost drift ready"); };
$("btnCOSTCopy").onclick = ()=>{ navigator.clipboard.writeText($("outCOST").textContent); toast("Copied"); };

// Agentic default play + SSE
$("btnAGENT").onclick = async ()=>{ await fetch("/agentic/run",{method:"POST"}); toast("Agentic started"); };
(function(){
  const ev = new EventSource("/events");
  ev.onmessage = (e)=>{ const box=$("outLOG"); box.textContent = (box.textContent==="—"?"":box.textContent+"\n") + e.data; };
})();

// Brief
$("btnBRIEF").onclick = async ()=>{ $("outBRIEF").value = await getText("/demo/brief"); toast("Executive brief generated"); };

// Unified Export menu — add myrn and rn confluence
document.addEventListener("click", async (e)=>{
  const exp = e.target?.dataset?.exp; if (!exp) return;
  const [kind, fmt] = exp.split(":"); let data, mime, name, email;
  if (kind==="rn")  {
    data = await getText(`/export/release-notes?format=${fmt}`, headersFromToggles());
    name = `release-notes.${fmt==="json"?"json":(fmt==="html"||fmt==="confluence"?"html":"md")}`;
    mime = fmt==="json"?"application/json":"text/html";
    if (fmt==="md") mime="text/markdown";
  } else if (kind==="myrn") {
    email = $("email").value.trim();
    data = await getText(`/export/release-notes?format=${fmt}&user=${encodeURIComponent(email)}`, headersFromToggles());
    name = `my-release-notes.${fmt==="confluence"?"html":fmt}`;
    mime = fmt==="md"?"text/markdown":"text/html";
  } else if (kind==="inc"){
    data = await getText(`/export/incidents?format=${fmt}`, headersFromToggles());
    name = `incidents.${fmt==="json"?"json":(fmt==="html"?"html":"md")}`;
    mime = fmt==="json"?"application/json":(fmt==="html"?"text/html":"text/markdown");
  } else if (kind==="api"){
    data = await getText(`/export/api-diff?format=${fmt}`, headersFromToggles());
    name = `api-diff.${fmt}`;
    mime = fmt==="json"?"application/json":"text/html";
  } else if (kind==="cost"){
    data = await getText(`/export/cost-drift?format=${fmt}`, headersFromToggles());
    name = `cost-drift.${fmt}`;
    mime = fmt==="json"?"application/json":(fmt==="html"?"text/html":"text/plain");
  } else if (kind==="brief"){
    data = await getText(`/export/brief?format=${fmt}`, headersFromToggles());
    name = `exec-brief.${fmt}`;
    mime = fmt==="html"?"text/html":"text/markdown";
  }
  download(name, mime, data); toast(`Downloaded ${name}`);
});
