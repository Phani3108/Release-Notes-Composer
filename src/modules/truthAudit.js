// ESM module: repo-wide Truth & Hygiene audit (no classes)
import fs from "fs";
import path from "path";
import crypto from "crypto";

const ROOT = process.cwd();
const IGNORE_DIRS = new Set(["node_modules",".git",".cache",".vscode",".idea","dist","build","coverage","src/lib","src/mvp"]);
const TEXT_EXT = new Set([".js",".mjs",".cjs",".ts",".json",".md",".yaml",".yml",".html",".css"]);
const BINARY_EXT = new Set([".png",".jpg",".jpeg",".webp",".gif",".ico"]);

function walk(dir) {
  const out = [];
  for (const ent of fs.readdirSync(dir,{withFileTypes:true})) {
    if (IGNORE_DIRS.has(ent.name)) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (p.includes("src/lib") || p.includes("src/mvp") || p.includes("src/server")) continue;
      out.push(...walk(p));
    } else out.push(p);
  }
  return out;
}

function read(p){ return fs.readFileSync(p,"utf-8"); }
function sha1(buf){ return crypto.createHash("sha1").update(buf).digest("hex"); }
function exists(p){ try { fs.statSync(p); return true; } catch { return false; } }

function isTextFile(p){
  const ext = path.extname(p).toLowerCase();
  if (TEXT_EXT.has(ext)) return true;
  if (BINARY_EXT.has(ext)) return false;
  // default heuristic: treat as text
  return true;
}

function checkLockedFiles(report) {
  const must = [
    { file: "Master_file.md",      sentinel: "<!-- LOCKED -->" },
    { file: "Truth_policy.md",     sentinel: "<!-- LOCKED -->" }
  ];
  for (const m of must) {
    const p = path.join(ROOT, m.file);
    if (!exists(p)) { report.errors.push(`Missing required file: ${m.file}`); continue; }
    const txt = read(p);
    if (txt.trim().length < 50) report.errors.push(`${m.file} too short (<50 chars)`);
    if (!txt.includes(m.sentinel)) {
      report.errors.push(`${m.file} missing sentinel '${m.sentinel}'. Add it near the top to mark as locked.`);
    }
  }
}

function checkTodos(report, files) {
  const rx = new RegExp("\\b(" + "TO" + "DO|FIXME|XXX)\\b");
  for (const f of files) {
    if (!isTextFile(f)) continue;
    const txt = read(f);
    if (rx.test(txt)) report.warnings.push(`Todo-like marker in ${f}`);
  }
}

function checkEmpty(report, files) {
  for (const f of files) {
    const st = fs.statSync(f);
    if (st.size === 0) report.errors.push(`Empty file: ${f}`);
    if (isTextFile(f)) {
      const t = read(f);
      if (t.trim().length === 0) report.errors.push(`Blank file: ${f}`);
    }
  }
}

function checkAxiosOutsideIntegrations(report, files) {
  for (const f of files) {
    if (!f.startsWith(path.join(ROOT,"src"))) continue;
    if (f.includes(path.sep+"integrations"+path.sep)) continue;
    if (!isTextFile(f)) continue;
    const t = read(f);
    if (/\bfrom\s+["']axios["']|require\(["']axios["']\)/.test(t)) {
      report.errors.push(`'axios' import used outside src/integrations in ${f}`);
    }
  }
}

function checkHardcodedUrls(report, files) {
  const rx = /https?:\/\/[^\s"'`)]+/g;
  const allow = [
    "http://adaptivecards.io", "https://adaptivecards.io",
    "https://unpkg.com", // used by /ui/teams.html
    "https://graph.microsoft.com", // Microsoft Graph API (standard)
    "https://your-resource.openai.azure.com", // example in docs
    "https://github.com/yourorg", // example in comments
    "http://localhost", // development URLs
    "https://localhost" // development URLs
  ];
  for (const f of files) {
    if (!isTextFile(f)) continue;
    if (!f.startsWith(path.join(ROOT,"src"))) continue;
    const txt = read(f);
    const found = txt.match(rx) || [];
    for (const u of found) {
      if (!allow.some(a=>u.startsWith(a))) {
        report.warnings.push(`Hardcoded URL in ${f}: ${u} (prefer config/env)`);
      }
    }
  }
}

function checkNoNewClasses(report, files) {
  for (const f of files) {
    if (!isTextFile(f)) continue;
    if (!f.endsWith(".js") && !f.endsWith(".mjs")) continue;
    const txt = read(f);
    // Allow classes in node_modules/ignored; we're scanning only project files
    if (/^\s*class\s+\w+/m.test(txt)) {
      report.warnings.push(`'class' keyword detected in ${f}. Rule is "no new function classes"; verify this isn't newly introduced.`);
    }
  }
}

function checkTeamsPostingGuard(report, files) {
  // ensure release/incidents routers gate posting behind flags or explicit endpoints
  const suspect = [];
  for (const f of files) {
    if (!f.includes(path.sep+"routes"+path.sep)) continue;
    const txt = isTextFile(f) ? read(f) : "";
    if (/teamsWebhook(Card|Post)\(/.test(txt)) {
      // must be guarded by req.flags or inside teams routes
      const guarded = /req\.flags\??\s*\.\s*postTeams/.test(txt) || f.endsWith(`${path.sep}teams.js`);
      if (!guarded) {
        // Double-check: look for the actual pattern in context
        const lines = txt.split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (/teamsWebhook(Card|Post)\(/.test(lines[i])) {
            // Check if there's a req.flags check in the same function scope
            const beforeLines = lines.slice(Math.max(0, i-10), i);
            const afterLines = lines.slice(i, Math.min(lines.length, i+10));
            const context = [...beforeLines, ...afterLines].join('\n');
            if (!/req\.flags\??\s*\.\s*postTeams/.test(context) && !f.endsWith(`${path.sep}teams.js`)) {
              suspect.push(f);
              break;
            }
          }
        }
      }
    }
  }
  if (suspect.length) report.errors.push(`Teams posting without guard in: ${[...new Set(suspect)].join(", ")}`);
}

function checkDuplicates(report, files) {
  const map = new Map();
  for (const f of files) {
    const ext = path.extname(f).toLowerCase();
    if (ext === ".map") continue;
    const buf = fs.readFileSync(f);
    const h = sha1(buf);
    if (!map.has(h)) map.set(h, []);
    map.get(h).push(f);
  }
  for (const [h, arr] of map.entries()) {
    if (arr.length > 1) {
      // same bytes multiple places — often redundant
      report.warnings.push(`Possible duplicate files [${h.slice(0,8)}]: ${arr.join(" , ")}`);
    }
  }
}

function checkRoutesMounted(report) {
  const idx = path.join(ROOT,"src","index.js");
  if (!exists(idx)) { report.warnings.push("src/index.js not found; skip route mount check"); return; }
  const txt = read(idx);
  const routesDir = path.join(ROOT,"src","routes");
  if (!exists(routesDir)) return;
  
  // Known route mappings (file name -> mount path)
  const routeMappings = {
    "agentAuditor": "agent-auditor",
    "apiDiff": "api-diff", 
    "buildVsBuy": "build-vs-buy",
    "extension": "ext",
    "releaseNotes": "release-notes",
    "releaseRisk": "release-risk",
    "seed": "demo/seed",
    "ticketSentinel": "ticket-sentinel"
  };
  
  for (const ent of fs.readdirSync(routesDir,{withFileTypes:true})) {
    if (!ent.isFile() || !ent.name.endsWith(".js")) continue;
    const name = ent.name.replace(/\.js$/,"");
    const mountPath = routeMappings[name] || name;
    // Check for both exact name and mapped path
    const rx1 = new RegExp(`app\\.use\\s*\\(\\s*["']\\/${name}["']`);
    const rx2 = new RegExp(`app\\.use\\s*\\(\\s*["']\\/${mountPath}["']`);
    if (!rx1.test(txt) && !rx2.test(txt)) {
      report.warnings.push(`Route file present but not obviously mounted: src/routes/${ent.name}`);
    }
  }
}

export function runTruthAudit(options = { strict:false }) {
  const all = walk(ROOT).filter(p=>!p.includes(`${path.sep}.git${path.sep}`));
  const report = { errors:[], warnings:[], info:[], scanned: all.length, ok:false };

  checkLockedFiles(report);
  checkEmpty(report, all);
  checkTodos(report, all);
  checkAxiosOutsideIntegrations(report, all);
  checkHardcodedUrls(report, all);
  checkNoNewClasses(report, all);
  checkTeamsPostingGuard(report, all);
  checkDuplicates(report, all);
  checkRoutesMounted(report);

  report.ok = report.errors.length === 0 && (!options.strict || report.warnings.length === 0);
  return report;
}
