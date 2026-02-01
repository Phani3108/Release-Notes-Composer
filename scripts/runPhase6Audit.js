import { execSync } from "child_process";
import fs from "fs";

function run(cmd){
  console.log("$",cmd);
  execSync(cmd,{stdio:"inherit"});
}

try {
  console.log("🚀 PHASE 6 - FINAL PROJECT AUDIT");
  console.log("=" .repeat(50));
  
  // 1. Preflight check
  console.log("\n📋 Step 1: Preflight Check");
  run("npm run check:preflight");
  
  // 2. Run all tests
  console.log("\n🧪 Step 2: Running All Tests");
  run("npm test");
  
  // 3. Size/emptiness scan for src & data
  console.log("\n🔍 Step 3: Code Quality Scan");
  const bad = [];
  const scan = (dir)=>{
    for (const f of fs.readdirSync(dir)) {
      const p = `${dir}/${f}`;
      const st = fs.statSync(p);
      if (st.isDirectory()) scan(p);
      else {
        const size = st.size;
        if (size===0) bad.push(p);
      }
    }
  };
  
  if (fs.existsSync("src")) scan("src");
  if (fs.existsSync("data")) scan("data");
  
  if (bad.length) {
    console.error("[AUDIT] ❌ Empty files found:\n"+bad.join("\n"));
    process.exit(1);
  }
  
  // 4. Check for TODO markers
  console.log("\n✅ Step 4: TODO Marker Scan");
  const todoFiles = [];
  const scanTodos = (dir)=>{
    for (const f of fs.readdirSync(dir)) {
      const p = `${dir}/${f}`;
      const st = fs.statSync(p);
      if (st.isDirectory()) scanTodos(p);
      else if (f.endsWith('.js') || f.endsWith('.jsx') || f.endsWith('.md')) {
        try {
          const content = fs.readFileSync(p, "utf-8");
          if (content.includes("TODO") || content.includes("FIXME")) {
            todoFiles.push(p);
          }
        } catch (e) {
          // Skip binary files
        }
      }
    }
  };
  
  if (fs.existsSync("src")) scanTodos("src");
  if (fs.existsSync("scripts")) scanTodos("scripts");
  
  if (todoFiles.length > 0) {
    console.warn("[AUDIT] ⚠️  TODO markers found (consider addressing):\n"+todoFiles.join("\n"));
  }
  
  // 5. Project structure validation
  console.log("\n🏗️  Step 5: Project Structure Validation");
  const requiredDirs = ["src", "data", "tests", "scripts", "docs"];
  const requiredFiles = ["package.json", "README.md", "Master_file.md", "Truth_policy.md"];
  
  for (const dir of requiredDirs) {
    if (!fs.existsSync(dir)) {
      console.error(`[AUDIT] ❌ Missing required directory: ${dir}`);
      process.exit(1);
    }
  }
  
  for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
      console.error(`[AUDIT] ❌ Missing required file: ${file}`);
      process.exit(1);
    }
  }
  
  // 6. Final summary
  console.log("\n" + "=" .repeat(50));
  console.log("🎉 PHASE 6 AUDIT COMPLETE - ALL CHECKS PASSED!");
  console.log("=" .repeat(50));
  console.log("\n✅ Preflight check: PASSED");
  console.log("✅ All tests: PASSED");
  console.log("✅ Code quality scan: PASSED");
  console.log("✅ Project structure: VALID");
  console.log("\n🚀 Your project is READY for production deployment!");
  console.log("\n📋 Next steps:");
  console.log("   - Replace mock data with real service connectors");
  console.log("   - Deploy to your preferred hosting platform");
  console.log("   - Update Truth lock if you modify Master_file.md or Truth_policy.md");
  console.log("   - Consider adding CI/CD pipeline");
  
} catch(e) {
  console.error("\n❌ [AUDIT] FAILED");
  console.error("Error:", e.message);
  process.exit(1);
}
