/**
 * Simple keyword clustering for local mock:
 * input tickets: [{id, text}]
 * output top 3 clusters with counts and draft jira titles
 */
export function clusterTickets(tickets) {
  const buckets = { auth:[], pay:[], ui:[], other:[] };
  for (const t of tickets) {
    const s = t.text.toLowerCase();
    if (s.includes("login") || s.includes("auth")) buckets.auth.push(t);
    else if (s.includes("payment") || s.includes("card")) buckets.pay.push(t);
    else if (s.includes("button") || s.includes("screen")) buckets.ui.push(t);
    else buckets.other.push(t);
  }
  const arr = Object.entries(buckets).map(([k,v])=>({cluster:k,count:v.length,tickets:v}));
  arr.sort((a,b)=>b.count-a.count);
  return arr.slice(0,3);
}

export function draftJiraIssues(clusters) {
  return clusters.map(c=>({
    projectKey: "CUST",
    title: `[${c.cluster.toUpperCase()}] Top ${c.count} recent issues`,
    description: c.tickets.map(x=>`- ${x.id}: ${x.text}`).join("\n")
  }));
}
