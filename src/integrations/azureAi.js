import axios from "axios";

const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
const apiKey   = process.env.AZURE_OPENAI_API_KEY;
const deploy   = process.env.AZURE_OPENAI_DEPLOYMENT;

/** Chat-completions style summarizer (kept generic) */
export async function aiSummarize(markdown, system="Summarize for release notes.") {
  if (!endpoint || !apiKey || !deploy) {
    // Local fallback: truncate/clean
    return markdown.split("\n").slice(0,60).join("\n");
  }
  const url = `${endpoint}/openai/deployments/${deploy}/chat/completions?api-version=2024-02-15-preview`;
  const res = await axios.post(url, {
    messages: [
      { role: "system", content: system },
      { role: "user", content: markdown }
    ],
    temperature: 0.2
  }, { headers: { "api-key": apiKey }});
  return res.data?.choices?.[0]?.message?.content ?? markdown;
}

/** Classify risks from text chunks */
export async function aiClassifyRisks(text) {
  if (!endpoint || !apiKey || !deploy) {
    // Local fallback: naive classification
    const t = text.toLowerCase();
    return t.includes("breaking") ? "Breaking" :
           t.includes("perf") ? "Performance" :
           t.includes("security") ? "Security" : "None";
  }
  const url = `${endpoint}/openai/deployments/${deploy}/chat/completions?api-version=2024-02-15-preview`;
  const res = await axios.post(url, {
    messages: [
      { role: "system", content: "Classify risk as one of: Breaking | Performance | Security | None" },
      { role: "user", content: text }
    ],
    temperature: 0
  }, { headers: { "api-key": apiKey }});
  return res.data?.choices?.[0]?.message?.content?.trim() ?? "None";
}
