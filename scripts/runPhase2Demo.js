import fs from "fs";
import { loadJSON, generateMarkdown } from "../src/modules/releaseNotes.js";
import { loadIncidents, mergeReleaseNotesWithIncidents } from "../src/modules/incidents.js";

console.log("=== PHASE 2 DEMO: Release Notes + Incidents Integration ===\n");

try {
  const prs = loadJSON("data/mock_prs.json");
  const jira = loadJSON("data/mock_jira.json");
  const rn = generateMarkdown(prs, jira);
  const inc = loadIncidents();
  
  console.log("Loaded data:");
  console.log(`- ${prs.length} PRs`);
  console.log(`- ${Object.keys(jira).length} JIRA tickets`);
  console.log(`- ${inc.length} active incidents\n`);
  
  const combined = mergeReleaseNotesWithIncidents(rn, inc);
  console.log("Combined Output (Release Notes + Incidents):");
  console.log("=".repeat(60));
  console.log(combined);
  console.log("=".repeat(60));
  
  console.log("\n✅ Phase 2 Demo Complete!");
  console.log("You can now run: npm run dev");
  console.log("Then visit:");
  console.log("- http://localhost:3000/release-notes");
  console.log("- http://localhost:3000/incidents");
  
} catch (error) {
  console.error("❌ Phase 2 Demo Failed:", error.message);
  process.exit(1);
}
