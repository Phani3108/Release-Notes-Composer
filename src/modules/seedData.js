import fs from "fs";

export function seedIfMissing() {
  fs.mkdirSync("data",{recursive:true});
  const writeIf = (p, obj) => { if (!fs.existsSync(p)) fs.writeFileSync(p, typeof obj==="string" ? obj : JSON.stringify(obj,null,2)); };

  writeIf("data/mock_prs.json", [
    { pr_number: 101, title: "Add SSO login", labels:["authentication"], repo:"auth-service", commits:[{message:"feat: sso"}], jira_keys:["AUTH-1"] },
    { pr_number: 102, title: "Optimize payment retries", labels:["payments"], repo:"payments-service", commits:[{message:"perf: backoff"}], jira_keys:["PAY-7"] }
  ]);

  writeIf("data/mock_jira.json", {
    "AUTH-1": { key:"AUTH-1", summary:"Single Sign-On for customers", status:"Done" },
    "PAY-7": { key:"PAY-7", summary:"Payment retry tuning", status:"In Progress" }
  });

  writeIf("data/filters.json", {
    "users": { "me@example.com": { "repos": ["payments-service","auth-service"], "labels": ["feature/authentication","payments"] } },
    "teams": { "payments-squad": { "repos": ["payments-service"], "labels": ["payments"] } },
    "defaults": { "repos": [], "labels": [] }
  });

  writeIf("data/feature_map.json", { "features":[
    { "name":"Authentication", "labels":["authentication","auth"], "repos":["auth-service"] },
    { "name":"Payments", "labels":["payments"], "repos":["payments-service"] }
  ]});

  writeIf("data/policies.json", {
    "roles": {
      "approver": ["approve_release","approve_incident"],
      "oncall":  ["update_incident_eta"],
      "viewer": []
    },
    "users": {
      "me@example.com": ["approver","oncall"],
      "oncall@example.com": ["oncall"]
    }
  });

  writeIf("data/openapi_before.json", {"openapi":"3.0.0","paths":{"/x":{"get":{}}},"components":{"schemas":{"U":{"properties":{"email":{},"id":{}}}}}});
  writeIf("data/openapi_after.json", {"openapi":"3.0.0","paths":{},"components":{"schemas":{"U":{"properties":{"id":{}}}}}});

  if (!fs.existsSync("data/approvals.json")) fs.writeFileSync("data/approvals.json","{}");

  return true;
}
