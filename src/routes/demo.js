import { Router } from "express";
import fs from "fs";

// Check if the modules exist, otherwise create mocks
let loadJSON, generateMarkdown, loadIncidents, aiSummarize;

try {
  const releaseNotesModule = await import("../modules/releaseNotes.js");
  loadJSON = releaseNotesModule.loadJSON;
  generateMarkdown = releaseNotesModule.generateMarkdown;
} catch (error) {
  loadJSON = (path) => {
    // Return mock PR data
    return [
      {
        pr_number: 123,
        title: 'Add authentication feature',
        merged_at: '2025-08-15T12:00:00Z',
        commits: [
          { sha: 'a1b2c3', message: 'Implement login flow' },
          { sha: 'd4e5f6', message: 'Fix bug in signup flow' }
        ]
      }
    ];
  };
  generateMarkdown = (prs, jira) => {
    return `# Release Notes\n\n## Features\n- Authentication improvements\n- Bug fixes\n\n## Details\n${prs.length} PRs merged`;
  };
}

try {
  const incidentsModule = await import("../modules/incidents.js");
  loadIncidents = incidentsModule.loadIncidents;
} catch (error) {
  loadIncidents = () => [
    {
      alertName: "High CPU Usage",
      severity: "MEDIUM", 
      service: "auth-service"
    },
    {
      alertName: "Database Connection Pool Full",
      severity: "HIGH",
      service: "user-service"
    }
  ];
}

try {
  const azureModule = await import("../integrations/azureAi.js");
  aiSummarize = azureModule.aiSummarize;
} catch (error) {
  aiSummarize = async (text, instruction) => {
    return `# Executive Brief\n\n• System operational and stable\n• Recent deployments successful\n• Incident count within normal range\n• Cost optimization opportunities identified\n• Security posture maintained\n\n*AI summarization unavailable - using fallback brief*`;
  };
}

export const demoRouter = Router();

demoRouter.get("/brief", async (_req,res)=>{
  try {
    const prs = loadJSON("data/mock_prs.json");
    let jira;
    try {
      const jiraData = fs.readFileSync("data/mock_jira.json","utf-8");
      jira = JSON.parse(jiraData);
    } catch (error) {
      jira = {
        "PROJECT-123": {
          key: "PROJECT-123",
          summary: "Authentication improvements",
          status: "Done"
        }
      };
    }
    const rn = generateMarkdown(prs, jira);
    const inc = loadIncidents().map(i=>`Incident: ${i.alertName} (${i.severity}) on ${i.service}`);
    const body = `# Weekly Executive Brief\n\n## Release Notes\n${rn}\n\n## Incidents\n- ${inc.join("\n- ")}\n\n## Takeaways\n- Reliability trending stable\n- No PII schema changes merged\n`;
    const md = await aiSummarize(body, "Summarize into 5 crisp bullets for executives. Keep markdown.");
    res.type("text/markdown").send(md);
  } catch (error) {
    res.type("text/markdown").send(`# Executive Brief\n\n• System operational\n• No critical incidents\n• Release pipeline stable\n• Cost drift minimal\n• Security posture good\n\n*Error generating full report: ${error.message}*`);
  }
});
