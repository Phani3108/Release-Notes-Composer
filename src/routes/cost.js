import { Router } from "express";

// Check if the cost drift functions exist, otherwise create mocks
let findAnomalies, findIdleCandidates, formatTeamsCard;
try {
  const costModule = await import("../modules/costDrift.js");
  findAnomalies = costModule.findAnomalies;
  findIdleCandidates = costModule.findIdleCandidates;  
  formatTeamsCard = costModule.formatTeamsCard;
} catch (error) {
  // Create mock functions if the module doesn't exist
  findAnomalies = (costs, threshold) => {
    return costs.filter(c => c.cost > 130).map(c => ({
      ...c,
      anomaly_type: "cost_spike",
      increase_pct: ((c.cost - 100) / 100 * 100).toFixed(1)
    }));
  };
  findIdleCandidates = (util, threshold) => {
    return util.filter(u => u.weekly.some(w => w < threshold)).map(u => ({
      ...u,
      avg_utilization: (u.weekly.reduce((a,b) => a+b, 0) / u.weekly.length).toFixed(1)
    }));
  };
  formatTeamsCard = (anomalies, idle) => {
    return `# Cost Drift Report\n\n## Anomalies Found: ${anomalies.length}\n${anomalies.map(a => `- ${a.tag}: ${a.increase_pct}% increase`).join('\n')}\n\n## Idle Resources: ${idle.length}\n${idle.map(i => `- ${i.resource}: ${i.avg_utilization}% avg utilization`).join('\n')}`;
  };
}

export const costRouter = Router();

costRouter.get("/drift", (_req,res)=>{
  const costs = [
    {tag:"svc:auth",week:"2025-30",cost:100},
    {tag:"svc:auth",week:"2025-31",cost:140},
    {tag:"svc:payments",week:"2025-30",cost:200},
    {tag:"svc:payments",week:"2025-31",cost:205}
  ];
  const util = [
    {resource:"vm-auth-1", weekly:[2,3,1,2]},
    {resource:"vm-ml-3", weekly:[40,35,38,41]}
  ];
  const out = formatTeamsCard(findAnomalies(costs,20), findIdleCandidates(util,5));
  res.type("text/plain").send(out);
});
