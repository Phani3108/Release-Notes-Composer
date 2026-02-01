import fs from "fs";
import path from "path";
import { diffOpenAPI } from "../src/modules/openapiDiff.js";

/**
 * Env:
 *   BEFORE_SPEC (path)  default: data/openapi_before.json
 *   AFTER_SPEC  (path)  default: data/openapi_after.json
 * Behavior:
 *   - Prints diff summary
 *   - Exits 1 if breaking changes detected
 */
const before = process.env.BEFORE_SPEC || "data/openapi_before.json";
const after  = process.env.AFTER_SPEC  || "data/openapi_after.json";

if (!fs.existsSync(before) || !fs.existsSync(after)) {
  console.error(`[gatekeeper] Spec files not found: BEFORE=${before}, AFTER=${after}`);
  process.exit(2);
}

const diff = diffOpenAPI(before, after);
const breaking = diff?.breaking || [];
const pii = diff?.pii || [];

console.log(`[gatekeeper] Breaking: ${breaking.length}, PII: ${pii.length}`);
if (breaking.length) {
  console.error("[gatekeeper] ❌ Breaking changes detected:");
  for (const b of breaking) console.error(" -", b);
  process.exit(1);
}
console.log("[gatekeeper] ✅ No breaking changes.");
process.exit(0);
