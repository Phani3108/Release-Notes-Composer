import fs from "fs";
import { loadJSON, generateMarkdown } from "../src/modules/releaseNotes.js";
import { aiSummarize } from "../src/integrations/azureAi.js";

/* Deterministic mode: with no AZURE env set, aiSummarize() returns first 60 lines → stable baseline */
const prs = loadJSON("data/mock_prs.json");
const jira = JSON.parse(fs.readFileSync("data/mock_jira.json","utf-8"));
const md = generateMarkdown(prs, jira);
const out = await aiSummarize(md, "Summarize as customer-facing notes.");
const goldPath = "tests/golden/release_notes_expected.md";

if (!fs.existsSync(goldPath)) {
  console.log("[EVAL] Creating golden at", goldPath);
  fs.mkdirSync("tests/golden", { recursive:true });
  fs.writeFileSync(goldPath, out);
  process.exit(0);
}
const gold = fs.readFileSync(goldPath,"utf-8");

/* Loose normalization: ignore extra whitespace lines */
function normalize(s){ return s.trim().replace(/\s+\n/g,"\n").replace(/\n{3,}/g,"\n\n"); }

if (normalize(out) === normalize(gold)) {
  console.log("[EVAL] PASS: summary matches golden");
  process.exit(0);
} else {
  console.error("[EVAL] FAIL: summary drifted");
  console.error("--- expected ---\n"+gold+"\n--- got ---\n"+out);
  process.exit(2);
}
