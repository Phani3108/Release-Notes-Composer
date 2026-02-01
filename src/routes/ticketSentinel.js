import { Router } from "express";
import { clusterTickets, draftJiraIssues } from "../modules/ticketSentinel.js";
const router = Router();

router.get("/", (_req, res) => {
  try {
    // Mock tickets for demo
    const tickets = [
      {id:"T1", text:"Login page fails when using SSO"},
      {id:"T2", text:"Payment card declined with error 502"},
      {id:"T3", text:"Button not clickable on mobile"},
      {id:"T4", text:"Auth token expires too quickly"},
      {id:"T5", text:"Card payment double-charged"}
    ];
    
    const clusters = clusterTickets(tickets);
    const jiraDrafts = draftJiraIssues(clusters);
    
    res.json({
      tickets: tickets,
      clusters: clusters,
      jiraDrafts: jiraDrafts
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/cluster", (req, res) => {
  try {
    const { tickets } = req.body;
    if (!Array.isArray(tickets)) {
      return res.status(400).json({ error: "Tickets must be an array" });
    }
    
    const clusters = clusterTickets(tickets);
    const jiraDrafts = draftJiraIssues(clusters);
    
    res.json({
      clusters: clusters,
      jiraDrafts: jiraDrafts
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export const ticketSentinelRouter = router;
