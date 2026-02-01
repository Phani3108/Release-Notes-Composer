import { Router } from "express";
import { findAnomalies, findIdleCandidates, formatTeamsCard } from "../modules/costDrift.js";
const router = Router();

router.post("/analyze", (req, res) => {
  try {
    const { costs, utilization, thresholdPct = 20, idleFloor = 5 } = req.body;
    
    if (!costs || !utilization) {
      return res.status(400).json({ error: "Both costs and utilization arrays are required" });
    }
    
    const anomalies = findAnomalies(costs, thresholdPct);
    const idle = findIdleCandidates(utilization, idleFloor);
    const teamsCard = formatTeamsCard(anomalies, idle);
    
    res.json({
      anomalies,
      idle,
      teamsCard,
      summary: {
        anomalyCount: anomalies.length,
        idleCount: idle.length
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export const costsRouter = router;
