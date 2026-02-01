import assert from "node:assert/strict";
import { 
  evaluateErrorBudget, 
  evaluatePerfBudget, 
  detectFlagRampAnomalies,
  assessReleaseRisk 
} from "../src/modules/releaseRisk.js";
import { compare, score, renderMarkdown } from "../src/modules/buildVsBuy.js";

console.log("🧪 Testing Phase 5 functionality...");

// Test Release Risk Manager
console.log("Testing Release Risk Manager...");

// Test error budget evaluation
const errorData = [
  { ts: 1, errors: 1, requests: 1000 },
  { ts: 2, errors: 1, requests: 1000 }
];
const eb = evaluateErrorBudget(errorData, 99.9);
assert.equal(typeof eb.pass, "boolean");
assert.ok(eb.recent.length > 0);
assert.ok(typeof eb.overall.avg, "number");
console.log("✅ Error budget evaluation tests passed");

// Test performance budget evaluation
const perf = evaluatePerfBudget({ LCP_ms: 2000, CLS: 0.05, TBT_ms: 150 });
assert.equal(typeof perf.pass, "boolean");
assert.ok(typeof perf.score, "number");
assert.ok(perf.score >= 0 && perf.score <= 100);
console.log("✅ Performance budget evaluation tests passed");

// Test flag ramp anomaly detection
const flags = [
  { name: "f", ramp: [{ step: 1, pct: 0 }, { step: 2, pct: 50 }] }
];
const anomalies = detectFlagRampAnomalies(flags, 25);
assert.equal(anomalies.length, 1);
assert.equal(anomalies[0].flag, "f");
assert.equal(anomalies[0].jump, 50);
console.log("✅ Flag ramp anomaly detection tests passed");

// Test comprehensive risk assessment
const metrics = {
  errorTimeseries: errorData,
  sloTarget: 99.9,
  performance: { LCP_ms: 2000, CLS: 0.05, TBT_ms: 150 },
  perfBudget: { LCP_ms: 2500, CLS: 0.1, TBT_ms: 200 },
  featureFlags: flags,
  maxFlagStep: 25
};
const risk = assessReleaseRisk(metrics);
assert.ok(["LOW", "MEDIUM", "HIGH"].includes(risk.overallRisk));
assert.ok(Array.isArray(risk.riskFactors));
assert.ok(Array.isArray(risk.recommendations));
console.log("✅ Comprehensive risk assessment tests passed");

// Test Build-vs-Buy Advisor
console.log("Testing Build-vs-Buy Advisor...");

// Test scoring function
const option = { cost: 100000, time_weeks: 8, risk: 0.3 };
const weights = { cost: 0.5, time: 0.3, risk: 0.2 };
const optionScore = score(option, weights);
assert.ok(typeof optionScore, "number");
assert.ok(optionScore > 0);
console.log("✅ Scoring function tests passed");

// Test comparison function
const input = {
  build: { cost: 1, time_weeks: 1, risk: 0.1 },
  buy: { cost: 2, time_weeks: 2, risk: 0.2 }
};
const cmp = compare(input);
assert.ok(["BUILD", "BUY"].includes(cmp.winner));
assert.ok(typeof cmp.delta, "number");
assert.ok(typeof cmp.confidence, "string");
console.log("✅ Comparison function tests passed");

// Test markdown rendering
const markdown = renderMarkdown(input, cmp);
assert.ok(typeof markdown, "string");
assert.ok(markdown.includes("Build vs Buy"));
assert.ok(markdown.includes(cmp.winner));
console.log("✅ Markdown rendering tests passed");

console.log("🎉 All Phase 5 tests passed!");
console.log("Release Risk Manager and Build-vs-Buy Advisor are working correctly!");
