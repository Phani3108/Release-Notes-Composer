import { 
  evaluateErrorBudget, 
  evaluatePerfBudget, 
  detectFlagRampAnomalies,
  assessReleaseRisk 
} from "../src/modules/releaseRisk.js";

console.log("🚀 Phase 5 Demo: AI Release Risk Manager");
console.log("=" .repeat(50));

// Test Error Budget Evaluation
console.log("\n📊 1. Error Budget Evaluation");
const errorTimeseries = [
  { ts: 1, errors: 10, requests: 10000 },
  { ts: 2, errors: 5, requests: 10000 },
  { ts: 3, errors: 15, requests: 20000 },
  { ts: 4, errors: 5, requests: 10000 },
  { ts: 5, errors: 1, requests: 10000 }
];

const eb = evaluateErrorBudget(errorTimeseries, 99.9);
console.log("Error Budget pass:", eb.pass);
console.log("Overall availability:", eb.overall.avg + "%");
console.log("Trend:", eb.overall.trend > 0 ? "↗️ Improving" : "↘️ Declining");
console.log("Recent data:", eb.recent.map(p => `${p.availability.toFixed(3)}%`).join(", "));

// Test Performance Budget Evaluation
console.log("\n⚡ 2. Performance Budget Evaluation");
const perf = evaluatePerfBudget(
  { LCP_ms: 2200, CLS: 0.07, TBT_ms: 180 },
  { LCP_ms: 2500, CLS: 0.1, TBT_ms: 200 }
);
console.log("Performance pass:", perf.pass);
console.log("Performance score:", perf.score + "%");
console.log("Details:");
Object.entries(perf.details).forEach(([metric, data]) => {
  console.log(`  ${metric}: ${data.value} vs ${data.budget} (${data.status})`);
});

// Test Feature Flag Ramp Anomaly Detection
console.log("\n🚩 3. Feature Flag Ramp Anomaly Detection");
const flags = [
  { 
    name: "newCheckout", 
    ramp: [
      { step: 1, pct: 5 },
      { step: 2, pct: 40 },
      { step: 3, pct: 60 },
      { step: 4, pct: 100 }
    ]
  },
  {
    name: "darkMode",
    ramp: [
      { step: 1, pct: 10 },
      { step: 2, pct: 25 },
      { step: 3, pct: 50 }
    ]
  }
];

const anomalies = detectFlagRampAnomalies(flags, 25);
console.log("Flag anomalies detected:", anomalies.length);
anomalies.forEach(a => {
  console.log(`  🚨 ${a.flag}: ${a.from}% → ${a.to}% (jump: +${a.jump}%, severity: ${a.severity})`);
});

// Test Comprehensive Release Risk Assessment
console.log("\n🔍 4. Comprehensive Release Risk Assessment");
const metrics = {
  errorTimeseries,
  sloTarget: 99.9,
  performance: { LCP_ms: 2200, CLS: 0.07, TBT_ms: 180 },
  perfBudget: { LCP_ms: 2500, CLS: 0.1, TBT_ms: 200 },
  featureFlags: flags,
  maxFlagStep: 25
};

const riskAssessment = assessReleaseRisk(metrics);
console.log("Overall Risk Level:", riskAssessment.overallRisk);
console.log("Risk Factors:", riskAssessment.riskFactors.length);
riskAssessment.riskFactors.forEach(factor => console.log(`  • ${factor}`));

console.log("\n📋 Recommendations:");
riskAssessment.recommendations.forEach(rec => console.log(`  ${rec}`));

console.log("\n✅ Phase 5 Demo Complete!");
console.log("The AI Release Risk Manager is ready to monitor your deployments!");
