import fs from "fs";

const POLICY_PATH = "data/policies.json";
let cache = null, mtime = 0;

function readPolicy() {
  try {
    const stat = fs.statSync(POLICY_PATH);
    if (!cache || stat.mtimeMs !== mtime) {
      cache = JSON.parse(fs.readFileSync(POLICY_PATH, "utf-8"));
      mtime = stat.mtimeMs;
    }
  } catch {
    cache = { roles:{}, users:{} };
  }
  return cache;
}

export function getUserEmail(req) {
  return String(req.headers["x-user-email"] || req.query.user || "");
}

export function can(userEmail, action) {
  const p = readPolicy();
  const roleList = (p.users?.[userEmail]) || [];
  const rolePerms = roleList.flatMap(r => p.roles?.[r] || []);
  return rolePerms.includes(action);
}
