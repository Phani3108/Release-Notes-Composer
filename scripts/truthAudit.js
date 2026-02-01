#!/usr/bin/env node
import fs from "fs";
import { runTruthAudit } from "../src/modules/truthAudit.js";

const strict = process.argv.includes("--strict");
const report = runTruthAudit({ strict });

const outPath = "audit/audit_report.json";
fs.mkdirSync("audit", { recursive:true });
fs.writeFileSync(outPath, JSON.stringify(report,null,2));

const fmt = (arr, tag) => arr.length ? `\n${tag}:\n - `+arr.join("\n - ") : "";
console.log(`[truth-audit] scanned files: ${report.scanned}`);
console.log(`[truth-audit] ok: ${report.ok}  errors: ${report.errors.length}  warnings: ${report.warnings.length}`);
if (report.errors.length) console.error(fmt(report.errors, "errors"));
if (report.warnings.length) console.warn(fmt(report.warnings, "warnings"));
process.exit(report.ok ? 0 : 1);
