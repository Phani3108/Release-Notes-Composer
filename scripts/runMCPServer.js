import readline from "readline";
import { handleLine } from "../src/integrations/mcp.js";

const rl = readline.createInterface({ 
  input: process.stdin, 
  crlfDelay: Infinity 
});

rl.on("line", handleLine);

console.error("MCP server (demo) ready on stdio");
console.error("Available tools: release_notes, incidents, api_diff, cost_drift");
console.error("Example: {\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/list\"}");
