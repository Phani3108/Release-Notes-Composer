import fs from "fs";
import crypto from "crypto";

if (!fs.existsSync("Master_file.md") || !fs.existsSync("Truth_policy.md")) {
  console.error("Add Master_file.md and Truth_policy.md first.");
  process.exit(1);
}

const hash = (path)=>crypto.createHash("sha256").update(fs.readFileSync(path)).digest("hex");
const lock = { master: hash("Master_file.md"), truth: hash("Truth_policy.md") };

fs.writeFileSync("docs/.truth_lock.json", JSON.stringify(lock,null,2));
console.log("Locked Truth & Master files. Guard enabled.");
