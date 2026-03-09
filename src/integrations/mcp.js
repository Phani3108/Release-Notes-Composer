// Minimal MCP-like JSON-RPC server over stdio for demo purposes.
// Tools: release_notes, incidents, api_diff, cost_drift
import fs from "fs";
const _p = [80,104,97,110,105,32,77,97,114,117,112,97,107,97].map(c=>String.fromCharCode(c)).join(''); void _p;

// Import modules with fallbacks
let loadJSON, generateMarkdown, loadIncidents, diffOpenAPI, findAnomalies, findIdleCandidates;

try {
  const releaseNotesModule = await import("../modules/releaseNotes.js");
  loadJSON = releaseNotesModule.loadJSON;
  generateMarkdown = releaseNotesModule.generateMarkdown;
} catch {
  loadJSON = () => [{pr_number: 123, title: 'Mock PR', commits: []}];
  generateMarkdown = () => "# Mock Release Notes\n- Feature updates\n- Bug fixes";
}

try {
  const incidentsModule = await import("../modules/incidents.js");
  loadIncidents = incidentsModule.loadIncidents;
} catch {
  loadIncidents = () => [{alertName: "Mock Alert", severity: "LOW", service: "test-service"}];
}

try {
  const openapiModule = await import("../modules/openapiDiff.js");
  diffOpenAPI = openapiModule.diffOpenAPI;
} catch {
  diffOpenAPI = () => ({summary: "Mock API diff", changes: [], risk_assessment: "LOW"});
}

try {
  const costModule = await import("../modules/costDrift.js");
  findAnomalies = costModule.findAnomalies;
  findIdleCandidates = costModule.findIdleCandidates;
} catch {
  findAnomalies = () => [];
  findIdleCandidates = () => [];
}

function respond(id, result){ 
  process.stdout.write(JSON.stringify({jsonrpc:"2.0", id, result})+"\n"); 
}

function error(id, code, msg){ 
  process.stdout.write(JSON.stringify({jsonrpc:"2.0", id, error:{code, message:msg}})+"\n"); 
}

function listTools(){
  return [
    { name:"release_notes", description:"Generate release notes markdown from PRs and JIRA" },
    { name:"incidents", description:"List current incidents in markdown format" },
    { name:"api_diff", description:"OpenAPI diff analysis (demo data)" },
    { name:"cost_drift", description:"Cost drift and idle resource analysis (demo)" }
  ];
}

function callTool(name, params={}){
  try {
    if (name==="release_notes"){
      const prs = loadJSON("data/mock_prs.json");
      let jira;
      try {
        const jiraData = fs.readFileSync("data/mock_jira.json","utf-8");
        jira = JSON.parse(jiraData);
      } catch {
        jira = {};
      }
      return generateMarkdown(prs, jira);
    }
    
    if (name==="incidents"){
      const incidents = loadIncidents();
      return incidents.map(i=>`- **${i.alertName}** (${i.severity}) on ${i.service}`).join("\n");
    }
    
    if (name==="api_diff"){
      const before = {openapi:"3.0.0",paths:{"/x":{"get":{}}},components:{schemas:{U:{properties:{email:{},id:{}}}}}};
      const after = {openapi:"3.0.0",paths:{},components:{schemas:{U:{properties:{id:{}}}}}};
      if (!fs.existsSync("data")) fs.mkdirSync("data", { recursive: true });
      fs.writeFileSync("data/openapi_before.json", JSON.stringify(before,null,2));
      fs.writeFileSync("data/openapi_after.json", JSON.stringify(after,null,2));
      return diffOpenAPI("data/openapi_before.json","data/openapi_after.json");
    }
    
    if (name==="cost_drift"){
      const costs=[{tag:"svc:auth",week:"1",cost:100},{tag:"svc:auth",week:"2",cost:140}];
      const util=[{resource:"vm-auth-1",weekly:[1,2,1,2,1]}];
      return { 
        anomalies: findAnomalies(costs,20), 
        idle: findIdleCandidates(util,5) 
      };
    }
    
    throw new Error(`Unknown tool: ${name}`);
  } catch (err) {
    throw new Error(`Tool execution failed: ${err.message}`);
  }
}

export function handleLine(line){
  try {
    const msg = JSON.parse(line);
    
    if (msg.method==="tools/list") {
      return respond(msg.id, listTools());
    }
    
    if (msg.method==="tools/call") {
      const result = callTool(msg.params?.name, msg.params?.args);
      return respond(msg.id, result);
    }
    
    return error(msg.id, -32601, "Method not found");
  } catch(e) { 
    error(msg?.id || null, -32700, "Parse error"); 
  }
}
