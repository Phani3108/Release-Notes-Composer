import fs from "fs";
import { loadJSON, generateMarkdown } from "../src/modules/releaseNotes.js";

console.log("=== PHASE 1 DEMO: Release Notes Composer ===\n");

try {
  const prs = loadJSON("data/mock_prs.json");
  const jira = loadJSON("data/mock_jira.json");
  
  console.log("Loaded mock data:");
  console.log(`- ${prs.length} PRs`);
  console.log(`- ${Object.keys(jira).length} JIRA tickets\n`);
  
  const markdown = generateMarkdown(prs, jira);
  console.log("Generated Release Notes:");
  console.log("=".repeat(50));
  console.log(markdown);
  console.log("=".repeat(50));
  
  console.log("\n✅ Phase 1 Demo Complete!");
  console.log("You can now run: npm run dev");
  console.log("Then visit: http://localhost:3000/release-notes");
  
} catch (error) {
  console.error("❌ Phase 1 Demo Failed:", error.message);
  process.exit(1);
}
