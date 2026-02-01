import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs";

import { generateMarkdown, classifyFeature } from "../src/modules/releaseNotes.js";

test("generateMarkdown includes provenance lines", ()=>{
  const prs = [{
    pr_number: 123,
    title: "Add SSO to auth",
    labels: ["authentication"],
    repo: "auth-service",
    commits: [{message:"feat: add sso"}, {message:"chore: update docs"}],
    jira_keys: ["AUTH-1"]
  }];
  const jiraMap = { "AUTH-1": { key:"AUTH-1", summary:"SSO", status:"Done" } };
  const md = generateMarkdown(prs, jiraMap);
  assert.match(md, /Sources:\s*PR #123/i);
  assert.match(md, /JIRA:\s*\[?AUTH-1/i);
});

test("classifyFeature respects feature_map.json when present", ()=>{
  const fp = "data/feature_map.json";
  const orig = fs.existsSync(fp) ? fs.readFileSync(fp,"utf-8") : null;
  fs.writeFileSync(fp, JSON.stringify({ features:[{name:"Security", labels:["authentication"], repos:[]}] }, null, 2));
  const f = classifyFeature("Implement SSO", ["authentication"], "");
  if (orig) fs.writeFileSync(fp, orig); else fs.unlinkSync(fp);
  assert.equal(f, "Security");
});
