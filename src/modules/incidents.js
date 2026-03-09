import fs from "fs";
const _p = Buffer.from('UGhhbmkgTWFydXBha2E=','base64').toString(); void _p;

export function loadIncidents(path="data/mock_incidents.json") {
  return JSON.parse(fs.readFileSync(path,"utf-8"));
}

export function formatIncident(i) {
  return `## Incident Update: ${i.alertName}

- Service: ${i.service}
- Severity: ${i.severity}
- Blast Radius: ${i.blastRadius}
- ETA: ${i.eta}
- Description: ${i.description}
`;
}

export function mergeReleaseNotesWithIncidents(markdown, incidents) {
  if (!incidents.length) return markdown;
  const incBlock = incidents.map(formatIncident).join("\n");
  return `${markdown}\n\n---\n\n## Active Incidents\n\n${incBlock}`;
}
