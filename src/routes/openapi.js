import { Router } from "express";
import { diffOpenAPI } from "../modules/openapiDiff.js";
const router = Router();

router.post("/diff", (req, res) => {
  try {
    const { beforePath, afterPath } = req.body;
    if (!beforePath || !afterPath) {
      return res.status(400).json({ error: "Both beforePath and afterPath are required" });
    }
    
    const diff = diffOpenAPI(beforePath, afterPath);
    res.json(diff);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export const openapiRouter = router;
