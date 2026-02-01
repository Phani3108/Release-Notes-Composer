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

// Check for empty files in src directory only (avoid scanning scripts to prevent recursion)
const bad = [];
const scanSrc = (dir)=>{
  for (const f of fs.readdirSync(dir)) {
    const p = `${dir}/${f}`;
    const st = fs.statSync(p);
    if (st.isDirectory()) {
      scanSrc(p);
    } else if (f.endsWith('.js') || f.endsWith('.jsx')) {
      const txt = fs.readFileSync(p,"utf-8");
      if (txt.includes("TODO") || txt.trim() === "") {
        bad.push(p);
      }
    }
  }
};

if (fs.existsSync("src")) scanSrc("src");

if (bad.length) {
  console.error("[PRE-FLIGHT] Empty files or TODO markers found in src:\n" + bad.join("\n"));
  process.exit(1);
}

console.log("[PRE-FLIGHT] OK");
