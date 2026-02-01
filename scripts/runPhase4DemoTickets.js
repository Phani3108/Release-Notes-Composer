import { clusterTickets, draftJiraIssues } from "../src/modules/ticketSentinel.js";
const tickets = [
  {id:"T1", text:"Login page fails when using SSO"},
  {id:"T2", text:"Payment card declined with error 502"},
  {id:"T3", text:"Button not clickable on mobile"},
  {id:"T4", text:"Auth token expires too quickly"},
  {id:"T5", text:"Card payment double-charged"}
];
const clusters = clusterTickets(tickets);
console.log("Top clusters:", clusters.map(c=>`${c.cluster}(${c.count})`).join(", "));
console.log("JIRA drafts:", draftJiraIssues(clusters));
