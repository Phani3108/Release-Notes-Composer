import { Router } from "express";
import { loadIncidents, formatIncident } from "../modules/incidents.js";
import { teamsWebhookPost } from "../integrations/teams.js";
const router = Router();

router.get("/", async (req,res)=>{
  const inc = loadIncidents();
  const out = inc.map(formatIncident).join("\n");
  
  // Honor UI toggles - only post to Teams if requested
  if (req.flags?.postTeams) {
    try {
      await teamsWebhookPost(out || "## No active incidents");
    } catch (e) {
      console.warn("Failed to post incidents to Teams:", e.message);
    }
  }
  
  res.type("text/markdown").send(out || "## No active incidents");
});

export const incidentRouter = router;
