import { Router } from "express";
import fs from "fs";
import { runTruthAudit } from "../modules/truthAudit.js";

export const auditRouter = Router();

auditRouter.get("/truth", (_req,res)=>{
  const strict = String(_req.query.strict||"0")==="1";
  const report = runTruthAudit({ strict });
  fs.mkdirSync("audit",{recursive:true});
  fs.writeFileSync("audit/audit_report.json", JSON.stringify(report,null,2));
  res.json(report);
});
