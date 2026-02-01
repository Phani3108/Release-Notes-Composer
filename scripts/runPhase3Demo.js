import { diffOpenAPI } from "../src/modules/openapiDiff.js";
import fs from "fs";

console.log("=== PHASE 3 DEMO: API Contract Gatekeeper ===\n");

try {
  // Create sample OpenAPI specs for comparison
  const before = {
    openapi: "3.0.0",
    paths: {
      "/users": { "get": {} },
      "/payments": { "post": {} }
    },
    components: {
      schemas: {
        User: {
          properties: {
            email: { type: "string" },
            id: { type: "string" }
          }
        }
      }
    }
  };
  
  const after = {
    openapi: "3.0.0",
    paths: {
      "/users": { "get": {} }
    },
    components: {
      schemas: {
        User: {
          properties: {
            id: { type: "string" }
          }
        }
      }
    }
  };
  
  // Write sample files
  fs.writeFileSync("data/openapi_before.json", JSON.stringify(before, null, 2));
  fs.writeFileSync("data/openapi_after.json", JSON.stringify(after, null, 2));
  
  console.log("Sample OpenAPI specs created:");
  console.log("- Before: /users (GET), /payments (POST), User.email property");
  console.log("- After:  /users (GET), User.id property only");
  console.log();
  
  // Run diff analysis
  const result = diffOpenAPI("data/openapi_before.json", "data/openapi_after.json");
  
  console.log("API Contract Analysis Results:");
  console.log("=".repeat(50));
  console.log("Breaking Changes:");
  if (result.breaking.length > 0) {
    result.breaking.forEach(change => console.log(`❌ ${change}`));
  } else {
    console.log("✅ None detected");
  }
  
  console.log("\nPII Fields Detected:");
  if (result.pii.length > 0) {
    result.pii.forEach(pii => console.log(`⚠️  ${pii}`));
  } else {
    console.log("✅ None detected");
  }
  
  console.log("\nWarnings:");
  if (result.warnings.length > 0) {
    result.warnings.forEach(warning => console.log(`⚠️  ${warning}`));
  } else {
    console.log("✅ None detected");
  }
  console.log("=".repeat(50));
  
  console.log("\n✅ Phase 3 Demo Complete!");
  console.log("You can now test the API endpoints:");
  console.log("- POST /openapi/diff - Compare OpenAPI specs");
  console.log("- POST /costs/analyze - Analyze cost anomalies");
  
} catch (error) {
  console.error("❌ Phase 3 Demo failed:", error.message);
  process.exit(1);
}
