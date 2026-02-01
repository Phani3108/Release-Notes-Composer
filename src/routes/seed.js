import { Router } from "express";
import { seedIfMissing } from "../modules/seedData.js";
export const seedRouter = Router();
seedRouter.post("/", (_req,res)=>{ seedIfMissing(); res.json({ ok:true }); });
