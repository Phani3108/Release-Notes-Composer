import fs from "fs";

export function readJSON(p){ return JSON.parse(fs.readFileSync(p,"utf-8")); }

/**
 * Very small diff:
 * - breaking: removed paths/methods
 * - breaking: removed schema properties
 * - pii: presence of fields suggesting PII in schemas (name,email,phone)
 */
export function diffOpenAPI(beforePath, afterPath) {
  const a = readJSON(beforePath);
  const b = readJSON(afterPath);
  const out = { breaking: [], pii: [], warnings: [] };

  // paths removal
  const aPaths = a.paths || {};
  const bPaths = b.paths || {};
  for (const path of Object.keys(aPaths)) {
    if (!bPaths[path]) { out.breaking.push(`Removed path: ${path}`); continue; }
    for (const method of Object.keys(aPaths[path])) {
      if (!bPaths[path][method]) out.breaking.push(`Removed method: ${method.toUpperCase()} ${path}`);
    }
  }

  // schema property removals + pii scan
  const aSchemas = (a.components?.schemas) || {};
  const bSchemas = (b.components?.schemas) || {};
  const piiHints = ["email","phone","ssn","aadhaar","pan","name","address"];
  for (const s of Object.keys(aSchemas)) {
    const aProps = aSchemas[s]?.properties || {};
    const bProps = bSchemas[s]?.properties || {};
    for (const p of Object.keys(aProps)) {
      if (!bProps[p]) out.breaking.push(`Removed property: ${s}.${p}`);
      if (piiHints.includes(p.toLowerCase())) out.pii.push(`PII field present: ${s}.${p}`);
    }
  }
  return out;
}
