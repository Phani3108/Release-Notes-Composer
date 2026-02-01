const OpenAI = require('openai');
const config = require('../config');
const logger = require('../utils/logger');

class OpenAIClient {
  constructor() {
    this.client = new OpenAI({
      apiKey: config.openai.apiKey,
    });
    this.model = config.openai.model;
    this.maxTokens = config.openai.maxTokens;
    
    logger.info('OpenAI client initialized', { model: this.model, maxTokens: this.maxTokens });
  }

  // Test connection to OpenAI
  async testConnection() {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: 'Hello, this is a test message.' }],
        max_tokens: 10,
      });
      
      logger.info('OpenAI connection test successful');
      return true;
    } catch (error) {
      logger.error('OpenAI connection test failed:', error);
      throw error;
    }
  }

  // Summarize pull request changes
  async summarizePRChanges(prData) {
    try {
      const prompt = `Summarize the following pull request changes in a concise, customer-friendly way:

Title: ${prData.title}
Description: ${prData.body || 'No description provided'}
Files Changed: ${prData.changedFiles}
Additions: ${prData.additions}
Deletions: ${prData.deletions}

Focus on:
- What new features or improvements this adds
- Any breaking changes or important notes
- Customer impact and benefits

Provide a 2-3 sentence summary suitable for release notes:`;

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200,
        temperature: 0.3,
      });

      const summary = response.choices[0].message.content.trim();
      logger.info('PR changes summarized successfully', { prNumber: prData.number });
      
      return summary;
    } catch (error) {
      logger.error('Failed to summarize PR changes:', error);
      throw error;
    }
  }

  // Classify PR by feature/module
  async classifyPR(prData) {
    try {
      const prompt = `Classify the following pull request into one of these categories:

Categories:
- Feature: New functionality or major enhancements
- Bug Fix: Bug fixes and corrections
- Performance: Performance improvements and optimizations
- Security: Security-related changes
- Documentation: Documentation updates
- Infrastructure: Build, deployment, or infrastructure changes
- Refactor: Code refactoring and improvements
- Test: Test-related changes

PR Title: ${prData.title}
PR Description: ${prData.body || 'No description'}
Files Changed: ${prData.changedFiles}

Respond with only the category name:`;

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 50,
        temperature: 0.1,
      });

      const category = response.choices[0].message.content.trim();
      logger.info('PR classified successfully', { prNumber: prData.number, category });
      
      return category;
    } catch (error) {
      logger.error('Failed to classify PR:', error);
      throw error;
    }
  }

  // Identify risks and breaking changes
  async identifyRisks(prData) {
    try {
      const prompt = `Analyze the following pull request for potential risks and breaking changes:

Title: ${prData.title}
Description: ${prData.body || 'No description'}
Files Changed: ${prData.changedFiles}
Additions: ${prData.additions}
Deletions: ${prData.deletions}

Identify:
1. Breaking changes (API changes, database schema changes, etc.)
2. Performance impacts
3. Security concerns
4. Compliance issues
5. Customer impact

Respond with a JSON object:
{
  "hasBreakingChanges": boolean,
  "breakingChanges": [array of specific changes],
  "performanceImpact": "low|medium|high",
  "securityConcerns": [array of concerns],
  "complianceIssues": [array of issues],
  "customerImpact": "low|medium|high",
  "riskLevel": "low|medium|high",
  "recommendations": [array of recommendations]
}`;

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        temperature: 0.2,
      });

      const riskAnalysis = JSON.parse(response.choices[0].message.content.trim());
      logger.info('Risk analysis completed', { prNumber: prData.number, riskLevel: riskAnalysis.riskLevel });
      
      return riskAnalysis;
    } catch (error) {
      logger.error('Failed to identify risks:', error);
      throw error;
    }
  }

  // Generate feature summary for release notes
  async generateFeatureSummary(prs, issues) {
    try {
      const prompt = `Generate a customer-friendly feature summary for the following changes:

Pull Requests:
${prs.map(pr => `- ${pr.title} (${pr.category})`).join('\n')}

Issues:
${issues.map(issue => `- ${issue.summary} (${issue.type})`).join('\n')}

Create a compelling summary that:
1. Highlights the most important new features
2. Explains customer benefits
3. Mentions any breaking changes or important notes
4. Uses clear, non-technical language

Format as a 3-4 paragraph summary suitable for release notes:`;

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 400,
        temperature: 0.4,
      });

      const summary = response.choices[0].message.content.trim();
      logger.info('Feature summary generated successfully');
      
      return summary;
    } catch (error) {
      logger.error('Failed to generate feature summary:', error);
      throw error;
    }
  }

  // Generate migration notes for breaking changes
  async generateMigrationNotes(breakingChanges) {
    try {
      const prompt = `Generate migration notes for the following breaking changes:

Breaking Changes:
${breakingChanges.map(change => `- ${change}`).join('\n')}

Create clear, step-by-step migration instructions that:
1. Explain what changed and why
2. Provide specific code examples
3. Include any required configuration updates
4. Offer rollback options if applicable

Format as a structured migration guide:`;

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 600,
        temperature: 0.3,
      });

      const migrationNotes = response.choices[0].message.content.trim();
      logger.info('Migration notes generated successfully');
      
      return migrationNotes;
    } catch (error) {
      logger.error('Failed to generate migration notes:', error);
      throw error;
    }
  }

  // Validate if the client is properly configured
  isConfigured() {
    return !!config.openai.apiKey;
  }
}

module.exports = OpenAIClient;
