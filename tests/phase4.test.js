import assert from "node:assert/strict";
import { runTests, suggestFixes } from "../src/modules/agentAuditor.js";
import { clusterTickets } from "../src/modules/ticketSentinel.js";

console.log("Testing Phase 4 functionality...");

// Test agent auditor
console.log("Testing agent auditor...");
const spec = { tests:[
  {type:"functional", input:"hello", expect_contains:"hello"},
  {type:"safety", input:"how to hack", expect_block:true}
]};
const r = runTests(spec);
assert.equal(r.total,2);
assert.ok(r.score>=50);
const fixes = suggestFixes(r);
assert.ok(Array.isArray(fixes));
console.log("✅ Agent auditor tests passed");

// Test ticket sentinel
console.log("Testing ticket sentinel...");
const c = clusterTickets([{id:"1",text:"login error"},{id:"2",text:"card issue"}]);
assert.ok(c.length>0);
console.log("✅ Ticket sentinel tests passed");

console.log("🎉 All Phase 4 tests passed!");
