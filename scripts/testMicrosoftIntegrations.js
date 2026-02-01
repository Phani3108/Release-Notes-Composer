#!/usr/bin/env node

/**
 * Test Microsoft Integrations Demo
 * 
 * This script demonstrates the Microsoft integrations with local fallbacks.
 * Run with: node scripts/testMicrosoftIntegrations.js
 */

import { teamsWebhookCard, makeReleaseNotesCard, teamsWebhookPost } from '../src/integrations/teams.js';
import { postChannelMessage, postAdaptiveCardToChannel } from '../src/integrations/graphTeams.js';
import { aiSummarize, aiClassifyRisks } from '../src/integrations/azureAi.js';
import { ensureConnection, setSchema, upsertItem } from '../src/integrations/graphConnectors.js';

console.log('🚀 Testing Microsoft Integrations...\n');

// Test 1: Teams Webhook (will skip if not configured)
console.log('1️⃣ Testing Teams Webhook Integration...');
try {
  await teamsWebhookPost('Hello from WorldClass SDLC Suite! 🎉');
  console.log('✅ Teams webhook message sent (or skipped if not configured)');
} catch (error) {
  console.log('⚠️  Teams webhook error (expected if not configured):', error.message);
}

// Test 2: Teams Adaptive Card
console.log('\n2️⃣ Testing Teams Adaptive Card...');
try {
  const card = makeReleaseNotesCard({
    title: 'Release Notes Demo',
    markdown: 'This is a test release note with **bold text** and *italics*.'
  });
  await teamsWebhookCard(card);
  console.log('✅ Teams Adaptive Card sent (or skipped if not configured)');
} catch (error) {
  console.log('⚠️  Teams card error (expected if not configured):', error.message);
}

// Test 3: Azure AI Summarization (will use local fallback)
console.log('\n3️⃣ Testing Azure AI Summarization...');
const longText = `
# Feature Update: Enhanced Authentication System

## Overview
We've completely overhauled our authentication system to provide better security and user experience.

## Changes Made
- Implemented OAuth 2.0 with OpenID Connect
- Added multi-factor authentication support
- Enhanced password policies with complexity requirements
- Added session management with configurable timeouts
- Implemented rate limiting for login attempts
- Added audit logging for all authentication events

## Security Improvements
- All passwords are now hashed using bcrypt with salt
- JWT tokens have configurable expiration times
- Added CSRF protection for all forms
- Implemented secure cookie settings

## User Experience
- Single sign-on integration with enterprise systems
- Remember me functionality with secure token storage
- Password reset via email with secure tokens
- Account lockout after failed attempts with admin notification

## Testing
- Comprehensive unit tests for all authentication flows
- Integration tests with various identity providers
- Security testing including penetration testing
- Performance testing under high load conditions

## Deployment Notes
- Database migrations required for new user table structure
- Environment variables need to be configured for OAuth providers
- SSL certificates must be valid for production deployment
- Monitoring and alerting should be configured for authentication events
`;

try {
  const summary = await aiSummarize(longText, 'Summarize for executives in 3 bullet points.');
  console.log('✅ AI Summary generated:');
  console.log(summary);
} catch (error) {
  console.log('⚠️  AI summarization error:', error.message);
}

// Test 4: Risk Classification
console.log('\n4️⃣ Testing Risk Classification...');
const testTexts = [
  'This is a breaking change that will affect all users',
  'Performance improvements for faster loading times',
  'Security patch for critical vulnerability',
  'Minor bug fix with no user impact'
];

for (const text of testTexts) {
  try {
    const risk = await aiClassifyRisks(text);
    console.log(`📝 "${text.substring(0, 50)}..." → Risk: ${risk}`);
  } catch (error) {
    console.log(`⚠️  Risk classification error for "${text.substring(0, 30)}...":`, error.message);
  }
}

// Test 5: Graph Connectors (will skip if not configured)
console.log('\n5️⃣ Testing Graph Connectors...');
try {
  await ensureConnection();
  await setSchema();
  await upsertItem('demo-rn-001', {
    type: 'release-note',
    title: 'Demo Release Note',
    module: 'Core',
    risk: 'None',
    url: 'https://demo.example.com/releases/001',
    contentMd: '# Demo Release\nThis is a test release note for Graph Connectors integration.'
  });
  console.log('✅ Graph Connector item created (or skipped if not configured)');
} catch (error) {
  console.log('⚠️  Graph Connector error (expected if not configured):', error.message);
}

// Test 6: Graph Teams API (will skip if not configured)
console.log('\n6️⃣ Testing Graph Teams API...');
try {
  await postChannelMessage('Test message from WorldClass SDLC Suite via Graph API');
  console.log('✅ Graph Teams message sent (or skipped if not configured)');
} catch (error) {
  console.log('⚠️  Graph Teams error (expected if not configured):', error.message);
}

console.log('\n🎉 Microsoft Integrations Demo Complete!');
console.log('\n📋 Summary:');
console.log('• Teams Webhook: Basic message posting');
console.log('• Teams Adaptive Cards: Rich card formatting');
console.log('• Azure AI: Summarization and risk classification with local fallbacks');
console.log('• Graph Connectors: Content indexing for Microsoft Search');
console.log('• Graph Teams: Authenticated channel messaging');
console.log('\n💡 To enable real integrations, configure the environment variables in .env');
console.log('💡 All integrations gracefully fall back to local functionality when not configured');
