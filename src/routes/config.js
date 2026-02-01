import { Router } from "express";
import fs from "fs";

export const configRouter = Router();

const FP = "data/feature_map.json";

function validateFeatureMap(obj) {
  if (typeof obj !== "object" || !obj) return "object required";
  if (!Array.isArray(obj.features)) return "features[] required";
  for (const f of obj.features) {
    if (!f || typeof f.name !== "string") return "feature.name string required";
    if (f.labels && !Array.isArray(f.labels)) return "feature.labels must be array";
    if (f.repos && !Array.isArray(f.repos)) return "feature.repos must be array";
  }
  return null;
}

configRouter.get("/feature-map", (_req,res)=>{
  if (!fs.existsSync(FP)) return res.json({ features: [] });
  res.json(JSON.parse(fs.readFileSync(FP,"utf-8")));
});

configRouter.put("/feature-map", (req,res)=>{
  const body = req.body;
  const err = validateFeatureMap(body);
  if (err) return res.status(400).json({ ok:false, error: err });
  fs.writeFileSync(FP, JSON.stringify(body,null,2));
  res.json({ ok:true });
});
