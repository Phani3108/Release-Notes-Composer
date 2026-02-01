import { loadSpec, runTests, suggestFixes } from "../src/modules/agentAuditor.js";
import { clusterTickets, draftJiraIssues } from "../src/modules/ticketSentinel.js";
import fs from "fs";

console.log("🚀 PHASE 4 FULL DEMO - Agent Auditor & Customer Issue Sentinel\n");

// 1. Agent Auditor Demo
console.log("1️⃣ AGENT AUDITOR DEMO");
console.log("=====================");

// Load and test the default spec
const spec = loadSpec("data/agent_spec.yaml");
console.log(`📋 Loaded spec: ${spec.name}`);
console.log(`📊 Tests: ${spec.tests.length}`);

const result = runTests(spec);
console.log(`🎯 Trust Score: ${result.score}% (${result.pass}/${result.total})`);

if (result.details.length > 0) {
  console.log("\n📝 Test Details:");
  result.details.forEach((detail, i) => {
    const status = detail.ok ? "✅ PASS" : "❌ FAIL";
    console.log(`   ${i+1}. ${detail.t.type.toUpperCase()}: ${status}`);
    if (detail.t.type === "functional") {
      console.log(`      Input: "${detail.t.input}" → Output: "${detail.out}"`);
    } else if (detail.t.type === "determinism") {
      console.log(`      Input: "${detail.t.input}" → Trials: ${detail.outs.join(", ")}`);
    } else if (detail.t.type === "safety") {
      console.log(`      Input: "${detail.t.input}" → Blocked: ${detail.out.includes("[BLOCKED]")}`);
    }
  });
}

const fixes = suggestFixes(result);
if (fixes.length > 0) {
  console.log("\n🔧 Suggested Fixes:");
  fixes.forEach(fix => console.log(`   • ${fix}`));
} else {
  console.log("\n🎉 No fixes needed - agent is performing well!");
}

// 2. Customer Issue Sentinel Demo
console.log("\n2️⃣ CUSTOMER ISSUE SENTINEL DEMO");
console.log("=================================");

const tickets = [
  {id:"T1", text:"Login page fails when using SSO"},
  {id:"T2", text:"Payment card declined with error 502"},
  {id:"T3", text:"Button not clickable on mobile"},
  {id:"T4", text:"Auth token expires too quickly"},
  {id:"T5", text:"Card payment double-charged"},
  {id:"T6", text:"Database connection timeout"},
  {id:"T7", text:"API rate limit exceeded"}
];

console.log(`📋 Processing ${tickets.length} customer tickets...`);

const clusters = clusterTickets(tickets);
console.log("\n🏷️  Clustering Results:");
clusters.forEach(cluster => {
  console.log(`   • ${cluster.cluster.toUpperCase()}: ${cluster.count} tickets`);
  cluster.tickets.forEach(ticket => {
    console.log(`     - ${ticket.id}: ${ticket.text}`);
  });
});

const jiraDrafts = draftJiraIssues(clusters);
console.log("\n📝 Generated JIRA Drafts:");
jiraDrafts.forEach(draft => {
  console.log(`   • ${draft.title}`);
  console.log(`     Project: ${draft.projectKey}`);
  console.log(`     Description: ${draft.description.split('\n').length} lines`);
});

// 3. Web API Status
console.log("\n3️⃣ WEB API STATUS");
console.log("==================");
console.log("🌐 Server endpoints available:");
console.log("   • GET  /agent-auditor - Default agent test results");
console.log("   • POST /agent-auditor/test - Custom agent testing");
console.log("   • GET  /ticket-sentinel - Default ticket clustering");
console.log("   • POST /ticket-sentinel/cluster - Custom ticket clustering");
console.log("\n💡 Try: curl http://localhost:3000/agent-auditor");
console.log("💡 Try: curl http://localhost:3000/ticket-sentinel");

console.log("\n🎉 Phase 4 Demo Complete!");
console.log("📊 Summary:");
console.log(`   • Agent Auditor: ${result.score}% trust score`);
console.log(`   • Ticket Sentinel: ${clusters.length} clusters identified`);
console.log(`   • JIRA Drafts: ${jiraDrafts.length} issues ready for creation`);
