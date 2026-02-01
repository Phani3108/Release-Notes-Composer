import fs from "fs";

/* ---------- UTIL ---------- */
export function loadJSON(path) {
  return JSON.parse(fs.readFileSync(path, "utf-8"));
}

const MAP_PATH = "data/feature_map.json";
let _mapCache = null, _mapMtime = 0;
function getFeatureMap() {
  try {
    const stat = fs.statSync(MAP_PATH);
    if (!_mapCache || stat.mtimeMs !== _mapMtime) {
      _mapCache = JSON.parse(fs.readFileSync(MAP_PATH, "utf-8"));
      _mapMtime = stat.mtimeMs;
    }
  } catch {
    _mapCache = { features: [] };
  }
  return _mapCache;
}

function jiraBase() {
  return (process.env.JIRA_BASE_URL || "").replace(/\/+$/,"");
}
function ghBase() {
  return (process.env.GITHUB_WEB_BASE || "").replace(/\/+$/,""); // e.g., https://github.com/yourorg
}
function ghPRLink(pr) {
  if (pr.url) return `[PR #${pr.pr_number}](${pr.url})`;
  const repo = pr.repo || "";
  const base = ghBase();
  if (base && repo && pr.pr_number) return `[PR #${pr.pr_number}](${base}/${repo}/pull/${pr.pr_number})`;
  return `PR #${pr.pr_number}`;
}
function jiraKeyLink(key) {
  const base = jiraBase();
  if (base && key) return `[${key}](${base}/browse/${key})`;
  return key;
}

/* ---------- CLASSIFIERS ---------- */
export function classifyFeature(title, labels=[], repo="") {
  const fm = getFeatureMap();
  if (fm?.features?.length) {
    for (const f of fm.features) {
      const hitRepo = (f.repos||[]).some(r => r.toLowerCase() === String(repo).toLowerCase());
      const hitLabel = (f.labels||[]).some(l => (labels||[]).map(x=>String(x).toLowerCase()).includes(String(l).toLowerCase()));
      if (hitRepo || hitLabel) return f.name;
    }
  }
  // heuristics fallback
  const lower = String(title||"").toLowerCase();
  if ((labels||[]).some(l=>String(l).toLowerCase().includes("authentication")) || lower.includes("auth")) return "Authentication";
  if ((labels||[]).some(l=>String(l).toLowerCase().includes("payments")) || lower.includes("payment")) return "Payments";
  return "Core";
}

export function riskTag(commits=[]) {
  const txt = commits.map(c=>String(c.message||"").toLowerCase()).join(" ");
  if (txt.includes("breaking change")) return "Risk: Breaking Change";
  if (txt.includes("perf") || txt.includes("latency")) return "Risk: Performance Impact";
  if (txt.includes("fix")) return "Risk: Minor Fix";
  return "Risk: None Detected";
}

export function linkJira(pr, jiraMap) {
  return (pr.jira_keys||[]).map(k => jiraMap[k]).filter(Boolean);
}

/* ---------- RENDERERS ---------- */
export function generateMarkdown(prs, jiraMap) {
  const groups = {};
  for (const pr of prs) {
    const feature = classifyFeature(pr.title, pr.labels, pr.repo);
    const risk = riskTag(pr.commits);
    const linked = linkJira(pr, jiraMap);
    (groups[feature] ||= []).push({ pr, risk, linked });
  }
  let out = "## Release Notes\n\n";
  for (const feature of Object.keys(groups)) {
    out += `### ${feature}\n`;
    for (const item of groups[feature]) {
      const { pr, risk, linked } = item;
      const jiraStr = linked.map(j=>`${jiraKeyLink(j.key)}: ${j.summary} [${j.status}]`).join("; ") || "None";
      const commits = (pr.commits||[]).map(c=>c.message).join(" | ");
      const prRef = ghPRLink(pr);
      out += `- ${prRef} — ${pr.title}\n`;
      out += `  - Commits: ${commits || "—"}\n`;
      out += `  - JIRA: ${jiraStr}\n`;
      out += `  - ${risk}\n`;
      out += `  - Sources: ${prRef}${linked.length ? ", JIRA: " + linked.map(j=>jiraKeyLink(j.key)).join(", ") : ""}\n`;
    }
    out += "\n";
  }
  return out.trim()+"\n";
}

/* Phase 2 additions kept */
export function filterPRs(prs, filters) {
  const wantRepos = new Set((filters?.repos||[]).map(s=>s.toLowerCase()));
  const wantLabels = new Set((filters?.labels||[]).map(s=>s.toLowerCase()));
  if (!wantRepos.size && !wantLabels.size) return prs;
  return prs.filter(pr=>{
    const repoOk = wantRepos.size ? wantRepos.has((pr.repo||"").toLowerCase()) : true;
    const labelsOk = wantLabels.size ? (pr.labels||[]).some(l=>wantLabels.has(String(l).toLowerCase())) : true;
    return repoOk || labelsOk;
  });
}

export function generatePersonalizedMarkdown(prs, jiraMap, filters, who="") {
  const subset = filterPRs(prs, filters);
  const head = who ? `## Release Notes for ${who}\n\n` : "## Release Notes (Personalized)\n\n";
  return head + generateMarkdown(subset, jiraMap).replace(/^## Release Notes.*\n\n/,"");
}
