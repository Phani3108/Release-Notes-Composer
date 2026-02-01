import { execSync } from "child_process";
import fs from "fs";

function run(cmd) {
  console.log("$", cmd);
  try {
    const result = execSync(cmd, { stdio: "pipe", encoding: "utf8" });
    return result;
  } catch (error) {
    console.error("Command failed:", error.message);
    return null;
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function demoPhase7() {
  console.log("🚀 PHASE 7 DEMO - PRODUCTION MONITORING & DEPLOYMENT");
  console.log("=" .repeat(60));
  
  // Check if server is running
  console.log("\n📋 Step 1: Checking server status...");
  const healthCheck = run("curl -s http://localhost:3000/health");
  if (healthCheck) {
    console.log("✅ Server is running and healthy");
  } else {
    console.log("❌ Server is not running. Please start with: npm run dev");
    return;
  }
  
  console.log("\n🔍 Step 2: Testing Production Endpoints");
  console.log("-" .repeat(40));
  
  // Test production health endpoint
  console.log("\n🏥 Testing enhanced health check...");
  const productionHealth = run("curl -s http://localhost:3000/production/health");
  if (productionHealth) {
    try {
      const health = JSON.parse(productionHealth);
      console.log(`✅ Health Status: ${health.status}`);
      console.log(`   Uptime: ${health.uptime}ms`);
      console.log(`   Response Time: ${health.responseTime}ms`);
      console.log(`   Checks: ${Object.keys(health.checks).length} health checks`);
    } catch (e) {
      console.log("⚠️  Health check response:", productionHealth);
    }
  }
  
  // Test metrics endpoint
  console.log("\n📊 Testing metrics collection...");
  const metrics = run("curl -s http://localhost:3000/production/metrics");
  if (metrics) {
    try {
      const metricsData = JSON.parse(metrics);
      console.log(`✅ Metrics collected successfully`);
      console.log(`   Total Requests: ${metricsData.data.requests.total}`);
      console.log(`   Error Rate: ${metricsData.data.errorRate.toFixed(2)}%`);
      console.log(`   Average Response Time: ${metricsData.data.responseTimes.average.toFixed(2)}ms`);
    } catch (e) {
      console.log("⚠️  Metrics response:", metrics);
    }
  }
  
  // Test deployment info
  console.log("\n🚀 Testing deployment information...");
  const deployment = run("curl -s http://localhost:3000/production/deployment");
  if (deployment) {
    try {
      const deploymentData = JSON.parse(deployment);
      console.log(`✅ Deployment info retrieved`);
      console.log(`   Version: ${deploymentData.data.version}`);
      console.log(`   Environment: ${deploymentData.data.environment}`);
      console.log(`   Node Version: ${deploymentData.data.nodeVersion}`);
      console.log(`   Platform: ${deploymentData.data.platform}`);
    } catch (e) {
      console.log("⚠️  Deployment response:", deployment);
    }
  }
  
  // Test system status
  console.log("\n💻 Testing system status...");
  const status = run("curl -s http://localhost:3000/production/status");
  if (status) {
    try {
      const statusData = JSON.parse(status);
      console.log(`✅ System status retrieved`);
      console.log(`   Health: ${statusData.data.health.status}`);
      console.log(`   Uptime: ${statusData.data.metrics.uptime}ms`);
      console.log(`   Request Count: ${statusData.data.metrics.requestCount}`);
      console.log(`   Memory Usage: ${Math.round(statusData.data.system.memory.heapUsed / 1024 / 1024)}MB`);
    } catch (e) {
      console.log("⚠️  Status response:", status);
    }
  }
  
  // Test performance profiling
  console.log("\n⚡ Testing performance profiling...");
  const profile = run("curl -s http://localhost:3000/production/profile");
  if (profile) {
    try {
      const profileData = JSON.parse(profile);
      console.log(`✅ Performance profile generated`);
      console.log(`   Requests per Minute: ${profileData.data.requestsPerMinute}`);
      console.log(`   Top Endpoints: ${profileData.data.topEndpoints.length} tracked`);
      if (profileData.data.topEndpoints.length > 0) {
        console.log(`   Most Active: ${profileData.data.topEndpoints[0].endpoint} (${profileData.data.topEndpoints[0].count} requests)`);
      }
    } catch (e) {
      console.log("⚠️  Profile response:", profile);
    }
  }
  
  // Test environment configuration
  console.log("\n⚙️  Testing environment configuration...");
  const config = run("curl -s http://localhost:3000/production/config");
  if (config) {
    try {
      const configData = JSON.parse(config);
      console.log(`✅ Configuration retrieved`);
      console.log(`   Environment: ${configData.data.environment}`);
      console.log(`   Port: ${configData.data.port}`);
      console.log(`   Log Level: ${configData.data.logLevel}`);
      console.log(`   Metrics Enabled: ${configData.data.enableMetrics}`);
      console.log(`   Health Checks: ${configData.data.enableHealthChecks}`);
    } catch (e) {
      console.log("⚠️  Config response:", config);
    }
  }
  
  // Generate some traffic for metrics
  console.log("\n🔄 Step 3: Generating traffic for metrics...");
  console.log("-" .repeat(40));
  
  const endpoints = [
    "/",
    "/health",
    "/mock-data",
    "/release-notes",
    "/incidents",
    "/openapi",
    "/costs",
    "/agent-auditor",
    "/ticket-sentinel",
    "/release-risk",
    "/build-vs-buy"
  ];
  
  console.log("📡 Making requests to generate metrics...");
  for (let i = 0; i < 5; i++) {
    for (const endpoint of endpoints) {
      run(`curl -s http://localhost:3000${endpoint} > /dev/null`);
      await sleep(100); // Small delay between requests
    }
    process.stdout.write(".");
  }
  console.log(" ✅");
  
  // Check updated metrics
  console.log("\n📊 Step 4: Checking updated metrics...");
  console.log("-" .repeat(40));
  
  const updatedMetrics = run("curl -s http://localhost:3000/production/metrics");
  if (updatedMetrics) {
    try {
      const metricsData = JSON.parse(updatedMetrics);
      console.log(`✅ Updated metrics retrieved`);
      console.log(`   Total Requests: ${metricsData.data.requests.total}`);
      console.log(`   Error Rate: ${metricsData.data.errorRate.toFixed(2)}%`);
      console.log(`   Average Response Time: ${metricsData.data.responseTimes.average.toFixed(2)}ms`);
      
      // Show top endpoints
      if (metricsData.data.requests.byEndpoint.size > 0) {
        console.log("\n🏆 Top Endpoints by Request Count:");
        const topEndpoints = Array.from(metricsData.data.requests.byEndpoint.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5);
        
        topEndpoints.forEach(([endpoint, count], index) => {
          console.log(`   ${index + 1}. ${endpoint}: ${count} requests`);
        });
      }
    } catch (e) {
      console.log("⚠️  Updated metrics response:", updatedMetrics);
    }
  }
  
  // Final summary
  console.log("\n" + "=" .repeat(60));
  console.log("🎉 PHASE 7 DEMO COMPLETE!");
  console.log("=" .repeat(60));
  
  console.log("\n✅ Production monitoring features tested:");
  console.log("   - Enhanced health checks with detailed status");
  console.log("   - Real-time metrics collection");
  console.log("   - Deployment information and system status");
  console.log("   - Performance profiling and insights");
  console.log("   - Environment configuration management");
  
  console.log("\n🚀 Production-ready features:");
  console.log("   - Security headers and middleware");
  console.log("   - Request timing and metrics");
  console.log("   - Comprehensive health monitoring");
  console.log("   - Performance tracking and analysis");
  
  console.log("\n📋 Next steps:");
  console.log("   - Deploy to production environment");
  console.log("   - Configure real monitoring tools (Prometheus, Grafana)");
  console.log("   - Set up alerting and notifications");
  console.log("   - Implement proper rate limiting");
  console.log("   - Add authentication and authorization");
  
  console.log("\n💡 Production endpoints available:");
  console.log("   - GET /production/health - Enhanced health check");
  console.log("   - GET /production/metrics - Real-time metrics");
  console.log("   - GET /production/status - System status");
  console.log("   - GET /production/profile - Performance insights");
  console.log("   - GET /production/config - Environment config");
  console.log("   - GET /production/deployment - Deployment info");
}

// Run the demo
demoPhase7().catch(console.error);
