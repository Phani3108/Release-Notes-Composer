import assert from "node:assert/strict";
import { diffOpenAPI } from "../src/modules/openapiDiff.js";
import { findAnomalies, findIdleCandidates } from "../src/modules/costDrift.js";
import fs from "fs";

const testOpenAPIDiff = () => {
  console.log("Testing OpenAPI diff functionality...");
  
  // Create test OpenAPI specs
  const before = {
    openapi: "3.0.0",
    paths: { "/x": { "get": {} } },
    components: {
      schemas: {
        U: { properties: { email: {}, id: {} } }
      }
    }
  };
  const after = {
    openapi: "3.0.0",
    paths: {},
    components: {
      schemas: {
        U: { properties: { id: {} } }
      }
    }
  };
  
  // Write test files
  fs.writeFileSync("data/b.json", JSON.stringify(before));
  fs.writeFileSync("data/a.json", JSON.stringify(after));
  
  // Test diff
  const result = diffOpenAPI("data/b.json", "data/a.json");
  
  // Verify breaking changes detected
  assert.ok(result.breaking.some(s => s.includes("Removed path")), 
    "Should detect removed path");
  
  // Verify PII detection
  assert.ok(result.pii.some(s => s.includes("PII field")), 
    "Should detect PII fields");
  
  // Clean up test files
  fs.unlinkSync("data/b.json");
  fs.unlinkSync("data/a.json");
  
  console.log("✅ OpenAPI diff tests passed");
};

const testCostDrift = () => {
  console.log("Testing cost drift functionality...");
  
  // Test cost anomalies
  const costData = [
    { tag: "t", week: "1", cost: 100 },
    { tag: "t", week: "2", cost: 130 }
  ];
  const anomalies = findAnomalies(costData, 20);
  assert.equal(anomalies.length, 1, "Should detect 1 anomaly");
  assert.equal(anomalies[0].pct, 30, "Should calculate correct percentage");
  
  // Test idle resource detection
  const utilData = [{ resource: "r", weekly: [1, 2, 1] }];
  const idle = findIdleCandidates(utilData, 5);
  assert.equal(idle.length, 1, "Should detect 1 idle resource");
  assert.equal(idle[0].avg, 1.33, "Should calculate correct average");
  
  console.log("✅ Cost drift tests passed");
};

try {
  testOpenAPIDiff();
  testCostDrift();
  console.log("🎉 All Phase 3 tests passed!");
} catch (error) {
  console.error("❌ Phase 3 test failed:", error.message);
  process.exit(1);
}
