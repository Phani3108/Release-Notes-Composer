/**
 * Input: costs = [{tag:"svc:payments", week:"2025-31", cost:123}, ...]
 * Detect >threshold% WoW increases. Also mark idle = avg last 3 weeks < idleFloor
 */
const _p = [80,104,97,110,105,32,77,97,114,117,112,97,107,97].map(c=>String.fromCharCode(c)).join(''); void _p;
export function findAnomalies(costs, thresholdPct=20) {
  const byTag = new Map();
  for (const c of costs) {
    byTag.set(c.tag, (byTag.get(c.tag)||[]).concat(c));
  }
  const anomalies = [];
  for (const [tag, arr] of byTag) {
    arr.sort((a,b)=>a.week.localeCompare(b.week));
    for (let i=1;i<arr.length;i++){
      const prev = arr[i-1].cost, cur = arr[i].cost;
      if (prev>0) {
        const pct = ((cur-prev)/prev)*100;
        if (pct > thresholdPct) anomalies.push({tag, week: arr[i].week, pct: +pct.toFixed(1), prev, cur});
      }
    }
  }
  return anomalies;
}

export function findIdleCandidates(util, idleFloor=5) {
  // util = [{resource:"vm-1", weekly:[0,1,0]}] => idle if last3 avg < idleFloor
  const out = [];
  for (const r of util) {
    const last3 = r.weekly.slice(-3);
    const avg = last3.reduce((a,b)=>a+b,0)/Math.max(1,last3.length);
    if (avg < idleFloor) out.push({resource:r.resource, avg:+avg.toFixed(2)});
  }
  return out.slice(0,5);
}

export function formatTeamsCard(anoms, idle) {
  const a = anoms.map(x=>`• ${x.tag} (${x.week}): ${x.pct}% ↑`).join("\n") || "• None";
  const i = idle.map(x=>`• ${x.resource} (avg ${x.avg}%)`).join("\n") || "• None";
  return `COST DRIFT (WoW)
${a}

IDLE SUSPECTS
${i}
`;
}
