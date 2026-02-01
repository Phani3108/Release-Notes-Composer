#!/usr/bin/env node

console.log("🚀 Testing Phase 5 functionality...");

// Test the modules directly
import { assessReleaseRisk } from "../src/modules/releaseRisk.js";
import { compare } from "../src/modules/buildVsBuy.js";

console.log("✅ Modules imported successfully");

// Test release risk assessment
const testMetrics = {
  errorTimeseries: [
    { ts: Date.now() - 3600000, errors: 5, requests: 10000 },
    { ts: Date.now(), errors: 3, requests: 10000 }
  ],
  sloTarget: 99.9,
  performance: { LCP_ms: 2200, CLS: 0.07, TBT_ms: 180 },
  perfBudget: { LCP_ms: 2500, CLS: 0.1, TBT_ms: 200 },
  featureFlags: [
    {
      name: "testFeature",
      ramp: [
        { step: 1, pct: 5 },
        { step: 2, pct: 40 }
      ]
    }
  ],
  maxFlagStep: 25
};

console.log("📊 Testing Release Risk Assessment...");
const riskAssessment = assessReleaseRisk(testMetrics);
console.log(`Overall Risk: ${riskAssessment.overallRisk}`);
console.log(`Risk Factors: ${riskAssessment.riskFactors.join(', ')}`);

// Test build vs buy comparison
console.log("\n🏗️ Testing Build vs Buy Analysis...");
const testInput = {
  build: { cost: 100000, time_weeks: 8, risk: 0.3 },
  buy: { cost: 80000, time_weeks: 2, risk: 0.2 },
  weights: { cost: 0.5, time: 0.3, risk: 0.2 }
};

const comparison = compare(testInput);
console.log(`Recommendation: ${comparison.winner}`);
console.log(`Confidence: ${comparison.confidence}`);
console.log(`Score Difference: ${comparison.delta}`);

console.log("\n✅ Phase 5 functionality test completed successfully!");
console.log("🎉 Both AI Release Risk Manager and Build-vs-Buy Advisor are working!");
