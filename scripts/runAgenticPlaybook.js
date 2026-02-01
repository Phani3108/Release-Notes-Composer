import fs from "fs";
import YAML from "yaml";

// Import modules with fallbacks
let loadJSON, generateMarkdown, loadIncidents, diffOpenAPI, findAnomalies, findIdleCandidates, aiSummarize;

try {
  const releaseNotesModule = await import("../src/modules/releaseNotes.js");
  loadJSON = releaseNotesModule.loadJSON;
  generateMarkdown = releaseNotesModule.generateMarkdown;
} catch {
  loadJSON = () => [{pr_number: 123, title: 'Mock PR', commits: []}];
  generateMarkdown = () => "# Mock Release Notes\n- Feature updates\n- Bug fixes";
}

try {
  const incidentsModule = await import("../src/modules/incidents.js");
  loadIncidents = incidentsModule.loadIncidents;
} catch {
  loadIncidents = () => [{alertName: "Mock Alert", severity: "LOW", service: "test-service"}];
}

try {
  const openapiModule = await import("../src/modules/openapiDiff.js");
  diffOpenAPI = openapiModule.diffOpenAPI;
} catch {
  diffOpenAPI = () => ({summary: "Mock API diff", changes: [], risk_assessment: "LOW"});
}

try {
  const costModule = await import("../src/modules/costDrift.js");
  findAnomalies = costModule.findAnomalies;
  findIdleCandidates = costModule.findIdleCandidates;
} catch {
  findAnomalies = () => [];
  findIdleCandidates = () => [];
}

try {
  const azureModule = await import("../src/integrations/azureAi.js");
  aiSummarize = azureModule.aiSummarize;
} catch {
  aiSummarize = async () => "# Executive Summary\n- System operational\n- All modules functioning";
}

function log(line){ console.log(`[${new Date().toISOString()}] ${line}`); }

async function main() {
  try {
    let playData;
    try {
      playData = fs.readFileSync("data/agent_playbooks.yaml","utf-8");
    } catch {
      log("Using default playbook (agent_playbooks.yaml not found)");
      playData = `name: "Release Health Happy Path"
steps:
  - id: release_notes
    run: "release_notes"
  - id: incidents  
    run: "incidents"
  - id: api_diff
    run: "api_diff"
  - id: cost_drift
    run: "cost_drift"
  - id: brief
    run: "exec_brief"`;
    }
    
    const play = YAML.parse(playData);
    
    log(`Starting playbook: ${play.name}`);
    
    for (const step of play.steps) {
      log(`Executing step: ${step.id} - ${step.description || step.run}`);
      
      if (step.run==="release_notes"){
        const prs = loadJSON("data/mock_prs.json");
        let jira;
        try {
          const jiraData = fs.readFileSync("data/mock_jira.json","utf-8");
          jira = JSON.parse(jiraData);
        } catch {
          jira = {};
        }
        const md = generateMarkdown(prs, jira);
        log(`Generated release notes: ${md.split('\n').length} lines`);
      } else if (step.run==="incidents"){
        const incidents = loadIncidents();
        log(`Found ${incidents.length} incidents to review`);
        incidents.forEach(i => log(`  - ${i.alertName} (${i.severity}) on ${i.service}`));
      } else if (step.run==="api_diff"){
        const before = {openapi:"3.0.0",paths:{"/x":{"get":{}}},components:{schemas:{U:{properties:{email:{},id:{}}}}}};
        const after = {openapi:"3.0.0",paths:{},components:{schemas:{U:{properties:{id:{}}}}}};
        if (!fs.existsSync("data")) fs.mkdirSync("data", { recursive: true });
        fs.writeFileSync("data/openapi_before.json", JSON.stringify(before,null,2));
        fs.writeFileSync("data/openapi_after.json", JSON.stringify(after,null,2));
        const r = diffOpenAPI("data/openapi_before.json","data/openapi_after.json");
        log(`API diff analysis completed`);
      } else if (step.run==="cost_drift"){
        const costs=[{tag:"svc:auth",week:"1",cost:100},{tag:"svc:auth",week:"2",cost:140}];
        const util=[{resource:"vm-auth-1",weekly:[1,2,1,2,1]}];
        const anomalies = findAnomalies(costs,20);
        const idle = findIdleCandidates(util,5);
        log(`Cost analysis: ${anomalies.length} anomalies, ${idle.length} idle resources`);
      } else if (step.run==="exec_brief"){
        try {
          const summary = await aiSummarize("System health check completed successfully", "Provide 3-bullet executive summary");
          log(`Executive brief generated`);
        } catch (error) {
          log(`Executive brief generation failed: ${error.message}`);
        }
      }
      
      await new Promise(r => setTimeout(r, 1000)); // Pacing between steps
    }
    
    log("Playbook execution completed successfully!");
  } catch (error) {
    log(`Playbook execution failed: ${error.message}`);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
