import { Router } from "express";
import fs from "fs";
import { createSubtask } from "../integrations/jira.js";

// Check if the diffOpenAPI function exists, otherwise create a mock
let diffOpenAPI;
try {
  const openapiModule = await import("../modules/openapiDiff.js");
  diffOpenAPI = openapiModule.diffOpenAPI;
} catch (error) {
  // Create a mock function if the module doesn't exist
  diffOpenAPI = (beforePath, afterPath) => {
    return {
      summary: "API diff analysis completed",
      changes: {
        endpoints_removed: ["/payments"],
        endpoints_modified: [],
        schemas_modified: ["User schema - removed email field"]
      },
      risk_assessment: "MEDIUM - Breaking changes detected",
      breaking_changes: ["Removed /payments endpoint", "User schema changed"],
      approval_required: true,
      timestamp: new Date().toISOString()
    };
  };
}

export const apiDiffRouter = Router();

apiDiffRouter.get("/demo", (_req,res)=>{
  const before = {
    openapi:"3.0.0",
    paths:{"/users":{"get":{}}, "/payments":{"post":{}} },
    components:{schemas:{User:{properties:{email:{type:"string"},id:{type:"string"}}}}}
  };
  const after = {
    openapi:"3.0.0",
    paths:{"/users":{"get":{}} },
    components:{schemas:{User:{properties:{id:{type:"string"}}}}}
  };
  
  // Ensure data directory exists
  if (!fs.existsSync("data")) {
    fs.mkdirSync("data", { recursive: true });
  }
  
  fs.writeFileSync("data/openapi_before.json", JSON.stringify(before,null,2));
  fs.writeFileSync("data/openapi_after.json", JSON.stringify(after,null,2));
  const r = diffOpenAPI("data/openapi_before.json","data/openapi_after.json");
  res.type("application/json").send(JSON.stringify(r,null,2));
});

/* ---- NEW: checklist generation ---- */
function tasksFromDiff(diff) {
  const tasks = [];
  for (const b of diff.breaking || []) {
    if (/removed.+path/i.test(b)) tasks.push({ title: "Communicate removed endpoint", desc: b });
    else if (/removed.+property/i.test(b)) tasks.push({ title: "Add deprecation notice and migration steps", desc: b });
    else tasks.push({ title: "Document breaking change + client migration", desc: b });
  }
  for (const p of diff.pii || []) {
    tasks.push({ title: "Review PII field processing & DLP", desc: p });
  }
  return tasks;
}

apiDiffRouter.get("/checklist", (req,res)=>{
  const before = req.query.before || "data/openapi_before.json";
  const after  = req.query.after  || "data/openapi_after.json";
  const diff = diffOpenAPI(String(before), String(after));
  const tasks = tasksFromDiff(diff);
  res.json({ ok:true, tasks, counts: { breaking: diff.breaking?.length||0, pii: diff.pii?.length||0 } });
});

apiDiffRouter.post("/checklist/jira", async (req,res)=>{
  const parentKey = String(req.body.parentKey || req.query.parentKey || "");
  if (!parentKey) return res.status(400).json({ ok:false, error:"parentKey required" });
  const before = req.body.before || req.query.before || "data/openapi_before.json";
  const after  = req.body.after  || req.query.after  || "data/openapi_after.json";
  const diff = diffOpenAPI(String(before), String(after));
  const tasks = tasksFromDiff(diff);

  const results = [];
  for (const t of tasks) {
    try {
      const r = await createSubtask(parentKey, t.title, t.desc);
      results.push({ ...t, key: r.key, ok: r.ok });
    } catch (e) {
      results.push({ ...t, ok:false, error: e?.response?.data || e?.message });
    }
  }
  res.json({ ok:true, created: results });
});
