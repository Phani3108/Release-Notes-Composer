import { compare, renderMarkdown, generateReport } from "../src/modules/buildVsBuy.js";

console.log("🏗️ Phase 5 Demo: Build-vs-Buy Advisor");
console.log("=" .repeat(50));

// Test Case 1: Standard comparison
console.log("\n📊 1. Standard Build vs Buy Comparison");
const input1 = {
  build: { cost: 120000, time_weeks: 8, risk: 0.3 },
  buy: { cost: 80000, time_weeks: 2, risk: 0.2 },
  weights: { cost: 0.5, time: 0.3, risk: 0.2 }
};

const cmp1 = compare(input1);
console.log("Recommendation:", cmp1.winner);
console.log("Confidence:", cmp1.confidence);
console.log("Score difference:", cmp1.delta);
console.log("Build score:", cmp1.sBuild);
console.log("Buy score:", cmp1.sBuy);

// Test Case 2: Different weighting
console.log("\n⚖️ 2. Time-Critical Scenario (Higher time weight)");
const input2 = {
  build: { cost: 100000, time_weeks: 12, risk: 0.4 },
  buy: { cost: 90000, time_weeks: 1, risk: 0.1 },
  weights: { cost: 0.3, time: 0.6, risk: 0.1 }
};

const cmp2 = compare(input2);
console.log("Recommendation:", cmp2.winner);
console.log("Confidence:", cmp2.confidence);
console.log("Time weight impact:", input2.weights.time * 100 + "%");

// Test Case 3: Risk-averse scenario
console.log("\n🛡️ 3. Risk-Averse Scenario (Higher risk weight)");
const input3 = {
  build: { cost: 80000, time_weeks: 6, risk: 0.5 },
  buy: { cost: 120000, time_weeks: 1, risk: 0.1 },
  weights: { cost: 0.2, time: 0.2, risk: 0.6 }
};

const cmp3 = compare(input3);
console.log("Recommendation:", cmp3.winner);
console.log("Confidence:", cmp3.confidence);
console.log("Risk weight impact:", input3.weights.risk * 100 + "%");

// Generate Markdown report for the first case
console.log("\n📝 4. Markdown Report Generation");
const markdown = renderMarkdown(input1, cmp1);
console.log("Generated Markdown length:", markdown.length, "characters");

// Generate JSON report
console.log("\n📊 5. JSON Report Generation");
const report = generateReport(input1, cmp1);
console.log("Report keys:", Object.keys(report));
console.log("Timestamp:", report.timestamp);

// Summary
console.log("\n🎯 Summary of All Scenarios:");
console.log("Scenario 1 (Standard):", cmp1.winner, `(${cmp1.confidence} confidence)`);
console.log("Scenario 2 (Time-critical):", cmp2.winner, `(${cmp2.confidence} confidence)`);
console.log("Scenario 3 (Risk-averse):", cmp3.winner, `(${cmp3.confidence} confidence)`);

console.log("\n✅ Phase 5 Build-vs-Buy Demo Complete!");
console.log("The advisor is ready to help with your technology decisions!");

// Save a sample report to file for inspection
import fs from "fs";
fs.writeFileSync("data/build_vs_buy_sample.md", markdown);
fs.writeFileSync("data/build_vs_buy_sample.json", JSON.stringify(report, null, 2));
console.log("\n💾 Sample reports saved to data/build_vs_buy_sample.*");
