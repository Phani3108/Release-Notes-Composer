import { Client } from "@microsoft/microsoft-graph-client";
import { ClientSecretCredential } from "@azure/identity";
import "isomorphic-fetch";

/**
 * Required env:
 * TENANT_ID, CLIENT_ID, CLIENT_SECRET, TEAM_ID, CHANNEL_ID
 */

function graphEnabled() {
  return !!(process.env.TENANT_ID && process.env.CLIENT_ID && process.env.CLIENT_SECRET && process.env.TEAM_ID && process.env.CHANNEL_ID);
}

function getGraphClient() {
  const cred = new ClientSecretCredential(process.env.TENANT_ID, process.env.CLIENT_ID, process.env.CLIENT_SECRET);
  return Client.initWithMiddleware({
    authProvider: {
      getAccessToken: async () => {
        const token = await cred.getToken("https://graph.microsoft.com/.default");
        return token.token;
      }
    }
  });
}

export async function postAdaptiveCardToChannel(card) {
  if (!graphEnabled()) throw new Error("Graph not configured");
  const client = getGraphClient();
  const body = {
    body: { contentType: "html", content: "<div>Adaptive Card</div>" },
    attachments: [{
      contentType: "application/vnd.microsoft.card.adaptive",
      contentUrl: null,
      content: card,
      name: "card.json"
    }]
  };
  const res = await client.api(`/teams/${process.env.TEAM_ID}/channels/${process.env.CHANNEL_ID}/messages`).post(body);
  return res; // includes id
}

export async function updateChannelMessageCard(messageId, card, approvedNote="Approved") {
  if (!graphEnabled()) throw new Error("Graph not configured");
  const client = getGraphClient();
  const body = {
    body: { contentType: "html", content: `<div>${approvedNote}</div>` },
    attachments: [{
      contentType: "application/vnd.microsoft.card.adaptive",
      contentUrl: null,
      content: card,
      name: "card.json"
    }]
  };
  await client.api(`/teams/${process.env.TEAM_ID}/channels/${process.env.CHANNEL_ID}/messages/${messageId}`).patch(body);
  return true;
}
