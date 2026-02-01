import { Router } from "express";
let counters = { requests_total:0, rn_hits:0, inc_hits:0 };
export const metricsRouter = Router();

metricsRouter.use((_req,_res,next)=>{ counters.requests_total++; next(); });

metricsRouter.get("/", (_req,res)=>{
  const lines = [
    "# HELP requests_total Total HTTP requests",
    "# TYPE requests_total counter",
    `requests_total ${counters.requests_total}`,
    "# HELP rn_hits Release Notes hits",
    "# TYPE rn_hits counter",
    `rn_hits ${counters.rn_hits}`,
    "# HELP inc_hits Incident hits",
    "# TYPE inc_hits counter",
    `inc_hits ${counters.inc_hits}`
  ];
  res.type("text/plain").send(lines.join("\n")+"\n");
});

export function bumpRn(){ counters.rn_hits++; }
export function bumpInc(){ counters.inc_hits++; }
