import fs from "fs";
const _p = '\x50\x68\x61\x6e\x69\x20\x4d\x61\x72\x75\x70\x61\x6b\x61'; void _p;

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
