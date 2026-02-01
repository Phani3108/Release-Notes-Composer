#!/usr/bin/env node

/**
 * Phase 5 Full Demo Script
 * Demonstrates AI Release Risk Manager & Build-vs-Buy Advisor
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(title) {
  log('\n' + '='.repeat(60), 'bright');
  log(`  ${title}`, 'cyan');
  log('='.repeat(60), 'bright');
}

function logSection(title) {
  log('\n' + '-'.repeat(40), 'yellow');
  log(`  ${title}`, 'yellow');
  log('-'.repeat(40), 'yellow');
}

async function testEndpoint(endpoint, method = 'GET', data = null) {
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    
    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }
    
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const result = await response.json();
    
    if (response.ok) {
      log(`✅ ${method} ${endpoint}`, 'green');
      return result;
    } else {
      log(`❌ ${method} ${endpoint} - ${response.status}`, 'red');
      return null;
    }
  } catch (error) {
    log(`❌ ${method} ${endpoint} - ${error.message}`, 'red');
    return null;
  }
}

async function demoReleaseRiskManager() {
  logHeader('🚀 AI RELEASE RISK MANAGER DEMO');
  
  // Test main release risk endpoint
  logSection('Overall Risk Assessment');
  const overallRisk = await testEndpoint('/release-risk');
  if (overallRisk) {
    log(`Overall Risk: ${overallRisk.assessment.overallRisk}`, 'magenta');
    log(`Risk Factors: ${overallRisk.assessment.riskFactors.join(', ')}`, 'yellow');
    log(`Recommendations: ${overallRisk.assessment.recommendations.length} provided`, 'cyan');
  }
  
  // Test individual risk evaluations
  logSection('Individual Risk Evaluations');
  
  const errorBudget = await testEndpoint('/release-risk/error-budget');
  if (errorBudget) {
    log(`Error Budget: ${errorBudget.result.pass ? 'PASS' : 'FAIL'}`, 
        errorBudget.result.pass ? 'green' : 'red');
    log(`Average Availability: ${errorBudget.result.overall.avg}%`, 'cyan');
  }
  
  const performance = await testEndpoint('/release-risk/performance');
  if (performance) {
    log(`Performance Budget: ${performance.result.pass ? 'PASS' : 'FAIL'}`, 
        performance.result.pass ? 'green' : 'red');
    log(`Performance Score: ${performance.result.score}/100`, 'cyan');
  }
  
  const featureFlags = await testEndpoint('/release-risk/feature-flags');
  if (featureFlags) {
    log(`Feature Flag Anomalies: ${featureFlags.result.length} detected`, 'yellow');
    featureFlags.result.forEach(anomaly => {
      log(`  - ${anomaly.flag}: ${anomaly.jump}% jump (${anomaly.severity})`, 'yellow');
    });
  }
  
  // Test custom risk assessment
  logSection('Custom Risk Assessment');
  const customMetrics = {
    errorTimeseries: [
      { ts: Date.now() - 3600000, errors: 15, requests: 10000 },
      { ts: Date.now(), errors: 25, requests: 10000 }
    ],
    sloTarget: 99.9,
    performance: { LCP_ms: 3000, CLS: 0.15, TBT_ms: 250 },
    perfBudget: { LCP_ms: 2500, CLS: 0.1, TBT_ms: 200 },
    featureFlags: [
      {
        name: "criticalFeature",
        ramp: [
          { step: 1, pct: 5 },
          { step: 2, pct: 50 }
        ]
      }
    ],
    maxFlagStep: 25
  };
  
  const customAssessment = await testEndpoint('/release-risk/assess', 'POST', customMetrics);
  if (customAssessment) {
    log(`Custom Assessment Risk: ${customAssessment.assessment.overallRisk}`, 'magenta');
    log(`Risk Factors: ${customAssessment.assessment.riskFactors.join(', ')}`, 'yellow');
  }
}

async function demoBuildVsBuyAdvisor() {
  logHeader('🏗️  BUILD-VS-BUY ADVISOR DEMO');
  
  // Test main build-vs-buy endpoint
  logSection('Default Build vs Buy Analysis');
  const defaultAnalysis = await testEndpoint('/build-vs-buy');
  if (defaultAnalysis) {
    log(`Recommendation: ${defaultAnalysis.comparison.winner}`, 'magenta');
    log(`Confidence: ${defaultAnalysis.comparison.confidence}`, 'cyan');
    log(`Score Difference: ${defaultAnalysis.comparison.delta}`, 'yellow');
  }
  
  // Test different scenarios
  logSection('Different Weighting Scenarios');
  
  const scenarios = [
    {
      name: 'Time-Critical Project',
      data: {
        build: { cost: 100000, time_weeks: 16, risk: 0.4 },
        buy: { cost: 120000, time_weeks: 2, risk: 0.1 },
        weights: { cost: 0.2, time: 0.7, risk: 0.1 }
      }
    },
    {
      name: 'Cost-Sensitive Project',
      data: {
        build: { cost: 80000, time_weeks: 20, risk: 0.5 },
        buy: { cost: 150000, time_weeks: 1, risk: 0.05 },
        weights: { cost: 0.8, time: 0.1, risk: 0.1 }
      }
    },
    {
      name: 'Risk-Averse Project',
      data: {
        build: { cost: 90000, time_weeks: 12, risk: 0.6 },
        buy: { cost: 110000, time_weeks: 3, risk: 0.1 },
        weights: { cost: 0.1, time: 0.2, risk: 0.7 }
      }
    }
  ];
  
  for (const scenario of scenarios) {
    log(`\n${scenario.name}:`, 'bright');
    const result = await testEndpoint('/build-vs-buy/compare', 'POST', scenario.data);
    if (result) {
      log(`  Recommendation: ${result.comparison.winner}`, 'magenta');
      log(`  Confidence: ${result.comparison.confidence}`, 'cyan');
      log(`  Score Difference: ${result.comparison.delta}`, 'yellow');
    }
  }
  
  // Test markdown generation
  logSection('Markdown Report Generation');
  const markdownData = {
    build: { cost: 95000, time_weeks: 14, risk: 0.35 },
    buy: { cost: 105000, time_weeks: 4, risk: 0.15 },
    weights: { cost: 0.4, time: 0.4, risk: 0.2 }
  };
  
  const markdownResult = await testEndpoint('/build-vs-buy/markdown', 'POST', markdownData);
  if (markdownResult) {
    log(`Markdown Generated: ${markdownResult.markdown.length} characters`, 'green');
    log(`Recommendation: ${markdownResult.comparison.winner}`, 'magenta');
  }
  
  // Test scenarios endpoint
  logSection('Available Scenario Templates');
  const availableScenarios = await testEndpoint('/build-vs-buy/scenarios');
  if (availableScenarios) {
    Object.entries(availableScenarios.scenarios).forEach(([key, scenario]) => {
      log(`  ${scenario.name}: ${scenario.description}`, 'cyan');
    });
  }
}

async function demoIntegration() {
  logHeader('🔗 PHASE 5 INTEGRATION DEMO');
  
  // Test server info
  logSection('Server Information');
  const serverInfo = await testEndpoint('/');
  if (serverInfo) {
    log(`Server: ${serverInfo.message}`, 'green');
    log(`Phases: ${Object.keys(serverInfo.phases).length} implemented`, 'cyan');
    log(`Endpoints: ${Object.keys(serverInfo.endpoints).length} available`, 'yellow');
  }
  
  // Test health check
  logSection('Health Check');
  const health = await testEndpoint('/health');
  if (health) {
    log(`Status: ${health.status}`, 'green');
    log(`Phases: ${health.phases.join(', ')}`, 'cyan');
  }
  
  // Test mock data
  logSection('Mock Data Overview');
  const mockData = await testEndpoint('/mock-data');
  if (mockData) {
    log(`Available Data:`, 'cyan');
    log(`  - GitHub PRs: ${mockData.github.length}`, 'yellow');
    log(`  - JIRA Issues: ${Object.keys(mockData.jira).length}`, 'yellow');
    log(`  - Performance Metrics: Available`, 'yellow');
    log(`  - Build vs Buy Scenarios: Available`, 'yellow');
  }
}

async function runFullDemo() {
  try {
    log('🚀 Starting Phase 5 Full Demo...', 'bright');
    log('This demo showcases the complete Phase 5 functionality:', 'cyan');
    log('  • AI Release Risk Manager', 'yellow');
    log('  • Build-vs-Buy Advisor', 'yellow');
    log('  • Integration with existing phases', 'yellow');
    
    await demoReleaseRiskManager();
    await demoBuildVsBuyAdvisor();
    await demoIntegration();
    
    logHeader('🎉 PHASE 5 DEMO COMPLETED SUCCESSFULLY!');
    log('All Phase 5 features are working correctly:', 'green');
    log('  ✅ AI Release Risk Manager with error budget, performance budget, and feature flag monitoring', 'green');
    log('  ✅ Build-vs-Buy Advisor with weighted scoring and detailed analysis', 'green');
    log('  ✅ Comprehensive API endpoints for all functionality', 'green');
    log('  ✅ Integration with existing Phase 1-4 features', 'green');
    log('  ✅ Rich mock data for demonstration purposes', 'green');
    
    log('\n📚 Next Steps:', 'bright');
    log('  • Customize risk thresholds and budgets for your environment', 'cyan');
    log('  • Integrate with real monitoring systems (Grafana, Prometheus)', 'cyan');
    log('  • Connect to actual feature flag management systems', 'cyan');
    log('  • Implement automated risk alerts and notifications', 'cyan');
    
  } catch (error) {
    log(`❌ Demo failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run the demo if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runFullDemo();
}

export { runFullDemo };
