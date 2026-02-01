import axios from "axios";
const webhook = process.env.TEAMS_WEBHOOK_URL;

export async function teamsWebhookPost(text) {
  if (!webhook) return console.warn("[Teams] TEAMS_WEBHOOK_URL not set; skipping");
  await axios.post(webhook, { text });
}
export async function teamsWebhookCard(card) {
  if (!webhook) return console.warn("[Teams] TEAMS_WEBHOOK_URL not set; skipping");
  await axios.post(webhook, {
    type: "message",
    attachments: [{ contentType: "application/vnd.microsoft.card.adaptive", content: card }]
  });
}

/* Utilities */
function stripProvenance(text) {
  return String(text || "")
    .split("\n")
    .filter(line => !/^(\s*-?\s*)?Sources:/i.test(line))
    .join("\n")
    .trim();
}

/* Release Notes card */
export function makeReleaseNotesCard({ title, markdown, approveUrl, showProvenance = true }) {
  const bodyText = showProvenance ? markdown : stripProvenance(markdown);
  const body = [
    { "type": "TextBlock", "size": "Large", "weight": "Bolder", "text": title },
    { "type": "TextBlock", "wrap": true, "text": bodyText }
  ];
  const actions = [];
  if (approveUrl) actions.push({ "type":"Action.OpenUrl", "title":"Approve", "url": approveUrl });
  return { "$schema":"http://adaptivecards.io/schemas/adaptive-card.json", "type":"AdaptiveCard", "version":"1.5", "body": body, "actions": actions };
}

/* Incident card (with ETA + links) */
export function makeIncidentCard({ title, text, grafanaUrl, sentryUrl, approveUrl, updateEtaUrl, eta, showProvenance = true }) {
  const linksLine = [grafanaUrl ? `Grafana: ${grafanaUrl}` : null, sentryUrl ? `Sentry: ${sentryUrl}` : null]
    .filter(Boolean).join(" | ");
  const baseBody = [
    { "type":"TextBlock","size":"Large","weight":"Bolder","text": title },
    { "type":"TextBlock","wrap":true,"text": text },
    { "type":"TextBlock","isSubtle":true,"wrap":true,"text": linksLine || "Links: —" },
    { "type":"TextBlock","wrap":true,"text": "ETA: " + (eta || "TBD") }
  ];
  const body = showProvenance ? baseBody : baseBody.filter(b => !/Links:/.test(b.text||""));
  const actions = [];
  if (approveUrl) actions.push({ "type":"Action.OpenUrl", "title":"Approve", "url": approveUrl });
  if (updateEtaUrl) actions.push({ "type":"Action.OpenUrl", "title":"Update ETA", "url": updateEtaUrl });
  return { "$schema":"http://adaptivecards.io/schemas/adaptive-card.json", "type":"AdaptiveCard", "version":"1.5", "body": body, "actions": actions };
}
