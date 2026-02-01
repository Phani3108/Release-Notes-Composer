import assert from "node:assert/strict";
import { mergeReleaseNotesWithIncidents } from "../src/modules/incidents.js";

// Test incident merging
const testIncidentMerging = () => {
  const md = "## Release Notes";
  const inc = [{alertName:"X",service:"S",severity:"High",blastRadius:"High",eta:"5m",description:"d"}];
  const out = mergeReleaseNotesWithIncidents(md, inc);
  assert.match(out, /## Active Incidents/);
  console.log("✅ Incident merging tests passed");
};

// Test empty incidents
const testEmptyIncidents = () => {
  const md = "## Release Notes";
  const inc = [];
  const out = mergeReleaseNotesWithIncidents(md, inc);
  assert.equal(out, md);
  console.log("✅ Empty incidents tests passed");
};

// Run all tests
try {
  testIncidentMerging();
  testEmptyIncidents();
  console.log("🎉 All incidents tests passed!");
} catch (error) {
  console.error("❌ Test failed:", error.message);
  process.exit(1);
}
