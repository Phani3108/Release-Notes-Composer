import "isomorphic-fetch";
import { Client } from "@microsoft/microsoft-graph-client";
import { ClientSecretCredential } from "@azure/identity";

function gClient() {
  const cred = new ClientSecretCredential(
    process.env.TENANT_ID, process.env.CLIENT_ID, process.env.CLIENT_SECRET
  );
  return Client.initWithMiddleware({
    authProvider: {
      getAccessToken: async () =>
        (await cred.getToken("https://graph.microsoft.com/.default")).token
    }
  });
}

const CONN_ID = process.env.GRAPH_CONN_ID || "worldclass";

/** 1) Create connection (idempotent-ish) */
export async function ensureConnection() {
  const client = gClient();
  try {
    await client.api(`/external/connections/${CONN_ID}`).get();
    return;
  } catch {}
  await client.api(`/external/connections`).post({
    id: CONN_ID,
    name: "WorldClass SDLC Suite",
    description: "Release notes, incidents, tickets as searchable items"
  });
}

/** 2) Register schema (call once or when changed) */
export async function setSchema() {
  const client = gClient();
  const schema = {
    baseType: "microsoft.graph.externalItem",
    properties: [
      { name:"type",   type:"string", isQueryable:true, isSearchable:true },
      { name:"title",  type:"string", isQueryable:true, isSearchable:true },
      { name:"module", type:"string", isQueryable:true, isSearchable:true },
      { name:"risk",   type:"string", isQueryable:true, isSearchable:true },
      { name:"url",    type:"string", isQueryable:false,isSearchable:false }
    ]
  };
  await client.api(`/external/connections/${CONN_ID}/schema`).put({ schema });
}

/** 3) Upsert item (id = your stable key) */
export async function upsertItem(id, { type, title, module, risk, url, contentMd }) {
  const client = gClient();
  const body = {
    id,
    properties: { type, title, module, risk, url },
    content: { value: contentMd, type: "text/markdown" },
    Acl: [{ type:"everyone", value:"", accessType:"grant" }]
  };
  await client.api(`/external/connections/${CONN_ID}/items/${encodeURIComponent(id)}`).put(body);
}
