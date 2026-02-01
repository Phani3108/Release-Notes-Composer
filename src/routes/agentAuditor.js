import { Router } from "express";
import { loadSpec, runTests, suggestFixes } from "../modules/agentAuditor.js";
const router = Router();

router.get("/", (_req, res) => {
  try {
    const spec = loadSpec("data/agent_spec.yaml");
    const result = runTests(spec);
    const fixes = suggestFixes(result);
    
    res.json({
      spec: spec.name,
      result: {
        pass: result.pass,
        total: result.total,
        score: result.score
      },
      details: result.details,
      suggestions: fixes
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/test", (req, res) => {
  try {
    const { spec } = req.body;
    if (!spec || !spec.tests) {
      return res.status(400).json({ error: "Invalid spec format" });
    }
    
    const result = runTests(spec);
    const fixes = suggestFixes(result);
    
    res.json({
      result: {
        pass: result.pass,
        total: result.total,
        score: result.score
      },
      details: result.details,
      suggestions: fixes
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export const agentAuditorRouter = router;
