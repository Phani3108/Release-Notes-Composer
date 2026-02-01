import { findAnomalies, findIdleCandidates, formatTeamsCard } from "../src/modules/costDrift.js";

console.log("=== PHASE 3 DEMO: Cost Drift Analysis ===\n");

try {
  // Sample cost data
  const costs = [
    { tag: "svc:auth", week: "2025-30", cost: 100 },
    { tag: "svc:auth", week: "2025-31", cost: 140 },
    { tag: "svc:payments", week: "2025-30", cost: 200 },
    { tag: "svc:payments", week: "2025-31", cost: 205 },
    { tag: "svc:ml", week: "2025-30", cost: 50 },
    { tag: "svc:ml", week: "2025-31", cost: 75 }
  ];
  
  // Sample utilization data
  const utilization = [
    { resource: "vm-auth-1", weekly: [2, 3, 1, 2] },
    { resource: "vm-ml-3", weekly: [40, 35, 38, 41] },
    { resource: "vm-legacy-1", weekly: [1, 0, 1, 0] }
  ];
  
  console.log("Sample Data:");
  console.log(`- ${costs.length} cost entries across ${new Set(costs.map(c => c.tag)).size} services`);
  console.log(`- ${utilization.length} resources with weekly utilization patterns`);
  console.log();
  
  // Analyze cost anomalies (threshold: 20% week-over-week increase)
  const anomalies = findAnomalies(costs, 20);
  console.log("Cost Anomalies (WoW > 20%):");
  if (anomalies.length > 0) {
    anomalies.forEach(anom => {
      console.log(`  • ${anom.tag} (${anom.week}): ${anom.pct}% ↑ (${anom.prev} → ${anom.cur})`);
    });
  } else {
    console.log("  ✅ None detected");
  }
  
  // Find idle resources (avg < 5% over last 3 weeks)
  const idle = findIdleCandidates(utilization, 5);
  console.log("\nIdle Resource Candidates (avg < 5%):");
  if (idle.length > 0) {
    idle.forEach(resource => {
      console.log(`  • ${resource.resource}: avg ${resource.avg}% utilization`);
    });
  } else {
    console.log("  ✅ None detected");
  }
  
  // Generate Teams card format
  const teamsCard = formatTeamsCard(anomalies, idle);
  console.log("\nTeams Card Format:");
  console.log("=".repeat(50));
  console.log(teamsCard);
  console.log("=".repeat(50));
  
  console.log("\n✅ Phase 3 Cost Demo Complete!");
  console.log("You can now test the cost analysis endpoint:");
  console.log("- POST /costs/analyze - Analyze cost data and utilization");
  
} catch (error) {
  console.error("❌ Phase 3 Cost Demo failed:", error.message);
  process.exit(1);
}
