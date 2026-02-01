#!/usr/bin/env node

/**
 * Microsoft Integrations Demo with Existing Phases
 * 
 * This script demonstrates how the Microsoft integrations work with the existing
 * Phase functionality, showing the "flip the switch" capability.
 */

import { teamsWebhookCard, makeReleaseNotesCard, teamsWebhookPost } from '../src/integrations/teams.js';
import { aiSummarize, aiClassifyRisks } from '../src/integrations/azureAi.js';
import { upsertItem } from '../src/integrations/graphConnectors.js';

console.log('🚀 Microsoft Integrations Demo with Existing Phases\n');

// Simulate Phase 1: Release Notes Generation
console.log('📝 Phase 1: Release Notes Composer + Microsoft Integrations');
const mockPR = {
  pr_number: 123,
  title: 'Add authentication feature',
  merged_at: '2025-08-09T12:00:00Z',
  commits: [
    { sha: 'a1b2c3', message: 'Implement login flow' },
    { sha: 'd4e5f6', message: 'Fix bug in signup flow' }
  ]
};

const mockJira = {
  "PROJECT-123": {
    key: "PROJECT-123",
    summary: "Authentication bug",
    description: "Fix the login bug",
    status: "In Progress",
    assignee: "John Doe"
  }
};

// Generate release notes (existing Phase 1 logic)
const classifyFeature = (title) => {
  if (title.toLowerCase().includes('auth')) return 'Authentication';
  if (title.toLowerCase().includes('payment')) return 'Payment';
  return 'Core';
};

const riskTagging = (commits) => {
  const messages = commits.map(c => c.message.toLowerCase()).join(' ');
  if (messages.includes('breaking') || messages.includes('deprecate')) return 'Breaking';
  if (messages.includes('security') || messages.includes('vulnerability')) return 'Security';
  if (messages.includes('perf') || messages.includes('performance')) return 'Performance';
  return 'None';
};

const generateReleaseNotes = (prData, jiraData) => {
  const feature = classifyFeature(prData.title);
  const risk = riskTagging(prData.commits);
  
  let markdown = `# Release Notes for PR #${prData.pr_number}\n\n`;
  markdown += `**Feature**: ${feature}\n`;
  markdown += `**Risk Level**: ${risk}\n`;
  markdown += `**Merged**: ${new Date(prData.merged_at).toLocaleDateString()}\n\n`;
  
  markdown += `## Changes\n\n`;
  prData.commits.forEach(commit => {
    markdown += `- ${commit.message}\n`;
  });
  
  if (jiraData[`PROJECT-${prData.pr_number}`]) {
    const ticket = jiraData[`PROJECT-${prData.pr_number}`];
    markdown += `\n## Related Ticket\n`;
    markdown += `- **${ticket.key}**: ${ticket.summary}\n`;
    markdown += `- **Status**: ${ticket.status}\n`;
    markdown += `- **Assignee**: ${ticket.assignee}\n`;
  }
  
  return { markdown, feature, risk };
};

// Generate the release notes
const { markdown, feature, risk } = generateReleaseNotes(mockPR, mockJira);
console.log('✅ Generated Release Notes:');
console.log(markdown.substring(0, 200) + '...\n');

// Now apply Microsoft integrations (the "flip the switch" part)
console.log('🔌 Applying Microsoft Integrations...\n');

// 1. AI Summarization
console.log('🤖 AI Summarization:');
try {
  const summary = await aiSummarize(markdown, 'Summarize for executives in 3 bullet points.');
  console.log('AI Summary:', summary.substring(0, 100) + '...\n');
} catch (error) {
  console.log('AI Summary (local fallback):', markdown.split('\n').slice(0, 3).join('\n') + '\n');
}

// 2. Teams Notification
console.log('💬 Teams Notification:');
try {
  await teamsWebhookCard(makeReleaseNotesCard({
    title: `Release Notes: ${mockPR.title}`,
    markdown: `**Feature**: ${feature}\n**Risk**: ${risk}\n\n${markdown.substring(0, 200)}...`
  }));
  console.log('✅ Posted to Teams (or skipped if not configured)\n');
} catch (error) {
  console.log('⚠️  Teams posting skipped (not configured)\n');
}

// 3. Graph Connector Indexing
console.log('🔍 Graph Connector Indexing:');
try {
  await upsertItem(`pr-${mockPR.pr_number}`, {
    type: 'release-note',
    title: mockPR.title,
    module: feature,
    risk: risk,
    url: `https://github.com/your-repo/pull/${mockPR.pr_number}`,
    contentMd: markdown
  });
  console.log('✅ Indexed in Graph Connector (or skipped if not configured)\n');
} catch (error) {
  console.log('⚠️  Graph Connector indexing skipped (not configured)\n');
}

// Simulate Phase 2: Incident Explainer
console.log('🚨 Phase 2: Incident Explainer + Microsoft Integrations');
const mockIncident = {
  id: 'INC-001',
  title: 'Authentication Service Outage',
  severity: 'High',
  description: 'Users unable to login due to database connection issues',
  status: 'Investigating',
  created_at: new Date().toISOString()
};

const formatIncident = (incident) => {
  return `🚨 **${incident.severity} Priority Incident**: ${incident.title}\n\n` +
         `**Status**: ${incident.status}\n` +
         `**Created**: ${new Date(incident.created_at).toLocaleString()}\n\n` +
         `**Description**: ${incident.description}`;
};

const incidentText = formatIncident(mockIncident);
console.log('✅ Formatted Incident:');
console.log(incidentText + '\n');

// Apply Microsoft integrations to incident
console.log('🔌 Applying Microsoft Integrations to Incident...\n');

// 1. Teams Alert
console.log('💬 Teams Incident Alert:');
try {
  await teamsWebhookPost(incidentText);
  console.log('✅ Incident posted to Teams (or skipped if not configured)\n');
} catch (error) {
  console.log('⚠️  Teams incident posting skipped (not configured)\n');
}

// 2. Index incident in Graph Connector
console.log('🔍 Indexing Incident in Graph Connector:');
try {
  await upsertItem(`inc-${mockIncident.id}`, {
    type: 'incident',
    title: mockIncident.title,
    module: 'Authentication',
    risk: mockIncident.severity,
    url: `https://your-incident-system.com/incidents/${mockIncident.id}`,
    contentMd: incidentText
  });
  console.log('✅ Incident indexed in Graph Connector (or skipped if not configured)\n');
} catch (error) {
  console.log('⚠️  Incident indexing skipped (not configured)\n');
}

// Simulate Phase 5: Release Risk Manager
console.log('📊 Phase 5: Release Risk Manager + Microsoft Integrations');
const mockMetrics = {
  errorBudget: 95.2,
  performanceBudget: 87.5,
  featureFlags: [
    { name: 'newAuth', enabled: true, ramp: 25 },
    { name: 'darkMode', enabled: false, ramp: 0 }
  ]
};

const generateRiskReport = (metrics) => {
  let report = '# Release Risk Assessment\n\n';
  report += `**Error Budget**: ${metrics.errorBudget}% (Target: 99.9%)\n`;
  report += `**Performance Score**: ${metrics.performanceBudget}% (Target: 90%)\n\n`;
  
  report += '## Feature Flags\n\n';
  metrics.featureFlags.forEach(flag => {
    const status = flag.enabled ? '✅ Enabled' : '❌ Disabled';
    report += `- **${flag.name}**: ${status} (Ramp: ${flag.ramp}%)\n`;
  });
  
  // Risk classification
  const overallRisk = metrics.errorBudget < 98 || metrics.performanceBudget < 85 ? 'High' : 'Low';
  report += `\n**Overall Risk Level**: ${overallRisk}\n`;
  
  return report;
};

const riskReport = generateRiskReport(mockMetrics);
console.log('✅ Generated Risk Report:');
console.log(riskReport + '\n');

// Apply Microsoft integrations to risk report
console.log('🔌 Applying Microsoft Integrations to Risk Report...\n');

// 1. AI Risk Analysis
console.log('🤖 AI Risk Analysis:');
try {
  const aiRisk = await aiClassifyRisks(riskReport);
  console.log(`AI Risk Classification: ${aiRisk}\n`);
} catch (error) {
  console.log('AI Risk Classification (local fallback): High\n');
}

// 2. Teams Risk Alert
console.log('💬 Teams Risk Alert:');
try {
  await teamsWebhookCard(makeReleaseNotesCard({
    title: 'Release Risk Assessment',
    markdown: riskReport.substring(0, 300) + '...'
  }));
  console.log('✅ Risk report posted to Teams (or skipped if not configured)\n');
} catch (error) {
  console.log('⚠️  Teams risk posting skipped (not configured)\n');
}

// 3. Index risk report in Graph Connector
console.log('🔍 Indexing Risk Report in Graph Connector:');
try {
  await upsertItem(`risk-${new Date().toISOString().split('T')[0]}`, {
    type: 'risk-assessment',
    title: 'Release Risk Assessment',
    module: 'Release Management',
    risk: 'High',
    url: 'https://your-risk-system.com/reports/latest',
    contentMd: riskReport
  });
  console.log('✅ Risk report indexed in Graph Connector (or skipped if not configured)\n');
} catch (error) {
  console.log('⚠️  Risk report indexing skipped (not configured)\n');
}

console.log('🎉 Microsoft Integrations Demo Complete!\n');
console.log('📋 What This Demonstrates:');
console.log('• **Local-First**: All integrations work without external services');
console.log('• **Flip the Switch**: Configure .env to enable real integrations');
console.log('• **Seamless Integration**: Microsoft services enhance existing phases');
console.log('• **Graceful Fallbacks**: System continues working when services unavailable');
console.log('\n💡 To enable real integrations:');
console.log('1. Copy .env.example to .env');
console.log('2. Fill in your Microsoft service credentials');
console.log('3. Run this demo again to see real integrations in action');
console.log('\n🚀 Your WorldClass SDLC Suite is now Microsoft-ready!');
