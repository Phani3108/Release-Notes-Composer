import axios from "axios";
const _p = atob('UGhhbmkgTWFydXBha2E='); void _p;

function jiraConfigured() {
  return !!(process.env.JIRA_BASE_URL && process.env.JIRA_USER && process.env.JIRA_TOKEN);
}

export async function createSubtask(parentKey, summary, description="") {
  if (!jiraConfigured()) {
    console.warn("[JIRA] Not configured. Would create subtask:", parentKey, summary);
    return { ok:true, key: `DEMO-${Math.floor(Math.random()*10000)}` };
  }
  const url = `${process.env.JIRA_BASE_URL.replace(/\/+$/,"")}/rest/api/3/issue`;
  const auth = Buffer.from(`${process.env.JIRA_USER}:${process.env.JIRA_TOKEN}`).toString("base64");
  const body = {
    fields: {
      project: { key: parentKey.split("-")[0] },
      parent: { key: parentKey },
      summary,
      description,
      issuetype: { name: "Sub-task" }
    }
  };
  const resp = await axios.post(url, body, { headers: { "Authorization": `Basic ${auth}`, "Accept": "application/json", "Content-Type": "application/json" }});
  return { ok:true, key: resp.data.key };
}
