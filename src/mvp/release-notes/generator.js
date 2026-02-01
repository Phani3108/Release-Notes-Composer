const logger = require('../../lib/utils/logger');

class ReleaseNotesGenerator {
  constructor(githubClient, jiraClient, openaiClient) {
    this.github = githubClient;
    this.jira = jiraClient;
    this.openai = openaiClient;
    
    logger.info('ReleaseNotesGenerator initialized');
  }

  // Generate release data for a specific version
  async generateReleaseData(version, options = {}) {
    try {
      logger.info('Generating release data for version:', version);
      
      // Get the release from GitHub
      const release = await this.github.getRelease(version);
      if (!release) {
        throw new Error(`Release ${version} not found`);
      }

      // Get PRs merged between the previous release and this one
      const previousRelease = await this.getPreviousRelease(version);
      const prs = await this.getMergedPRs(previousRelease?.tag_name, release.tag_name);
      
      // Get JIRA issues linked to these PRs
      const issues = await this.getLinkedJiraIssues(prs);
      
      // Process and enrich the data
      const enrichedPRs = await this.enrichPullRequests(prs);
      const enrichedIssues = await this.enrichJiraIssues(issues);
      
      // Generate AI-powered insights
      const insights = await this.generateInsights(enrichedPRs, enrichedIssues);
      
      const releaseData = {
        version,
        releaseDate: release.published_at,
        previousVersion: previousRelease?.tag_name,
        pullRequests: enrichedPRs,
        issues: enrichedIssues,
        insights,
        metadata: {
          generatedAt: new Date().toISOString(),
          totalPRs: enrichedPRs.length,
          totalIssues: enrichedIssues.length,
          breakingChanges: insights.breakingChanges.length,
          riskLevel: insights.overallRiskLevel
        }
      };
      
      logger.info('Release data generated successfully', { 
        version, 
        prCount: enrichedPRs.length,
        issueCount: enrichedIssues.length 
      });
      
      return releaseData;
      
    } catch (error) {
      logger.error('Failed to generate release data:', error);
      throw error;
    }
  }

  // Generate release data for a date range
  async generateReleaseDataForDateRange(startDate, endDate, options = {}) {
    try {
      logger.info('Generating release data for date range:', { startDate, endDate });
      
      // Get PRs merged in the date range
      const prs = await this.getMergedPRsByDateRange(startDate, endDate);
      
      // Get JIRA issues linked to these PRs
      const issues = await this.getLinkedJiraIssues(prs);
      
      // Process and enrich the data
      const enrichedPRs = await this.enrichPullRequests(prs);
      const enrichedIssues = await this.enrichJiraIssues(issues);
      
      // Generate AI-powered insights
      const insights = await this.generateInsights(enrichedPRs, enrichedIssues);
      
      const releaseData = {
        dateRange: { startDate, endDate },
        pullRequests: enrichedPRs,
        issues: enrichedIssues,
        insights,
        metadata: {
          generatedAt: new Date().toISOString(),
          totalPRs: enrichedPRs.length,
          totalIssues: enrichedIssues.length,
          breakingChanges: insights.breakingChanges.length,
          riskLevel: insights.overallRiskLevel
        }
      };
      
      logger.info('Date range release data generated successfully', { 
        startDate, 
        endDate,
        prCount: enrichedPRs.length,
        issueCount: enrichedIssues.length 
      });
      
      return releaseData;
      
    } catch (error) {
      logger.error('Failed to generate date range release data:', error);
      throw error;
    }
  }

  // Get the previous release
  async getPreviousRelease(currentVersion) {
    try {
      const releases = await this.github.getReleases(10); // Get last 10 releases
      const currentIndex = releases.findIndex(r => r.tag_name === currentVersion);
      
      if (currentIndex === -1 || currentIndex === releases.length - 1) {
        return null; // No previous release
      }
      
      return releases[currentIndex + 1];
    } catch (error) {
      logger.warn('Failed to get previous release:', error);
      return null;
    }
  }

  // Get merged PRs between two tags
  async getMergedPRs(fromTag, toTag) {
    try {
      let prs = [];
      
      if (fromTag) {
        // Get PRs merged between the two tags
        const fromCommit = await this.github.getCommitByTag(fromTag);
        const toCommit = await this.github.getCommitByTag(toTag);
        
        if (fromCommit && toCommit) {
          prs = await this.github.getMergedPRsBetweenCommits(fromCommit.sha, toCommit.sha);
        }
      } else {
        // If no previous release, get all PRs up to this release
        const toCommit = await this.github.getCommitByTag(toTag);
        if (toCommit) {
          prs = await this.github.getMergedPRsUpToCommit(toCommit.sha);
        }
      }
      
      logger.info('Retrieved merged PRs:', { fromTag, toTag, count: prs.length });
      return prs;
      
    } catch (error) {
      logger.error('Failed to get merged PRs:', error);
      throw error;
    }
  }

  // Get merged PRs by date range
  async getMergedPRsByDateRange(startDate, endDate) {
    try {
      const prs = await this.github.getMergedPRsByDateRange(startDate, endDate);
      logger.info('Retrieved merged PRs by date range:', { startDate, endDate, count: prs.length });
      return prs;
    } catch (error) {
      logger.error('Failed to get merged PRs by date range:', error);
      throw error;
    }
  }

  // Get JIRA issues linked to PRs
  async getLinkedJiraIssues(prs) {
    try {
      const issues = [];
      
      for (const pr of prs) {
        // Extract JIRA issue keys from PR title, description, and commits
        const issueKeys = this.extractJiraIssueKeys(pr);
        
        for (const key of issueKeys) {
          try {
            const issue = await this.jira.getIssue(key);
            if (issue) {
              issue.linkedPRs = issue.linkedPRs || [];
              issue.linkedPRs.push(pr.number);
              issues.push(issue);
            }
          } catch (error) {
            logger.warn(`Failed to get JIRA issue ${key}:`, error.message);
          }
        }
      }
      
      // Remove duplicates
      const uniqueIssues = issues.filter((issue, index, self) => 
        index === self.findIndex(i => i.key === issue.key)
      );
      
      logger.info('Retrieved linked JIRA issues:', { count: uniqueIssues.length });
      return uniqueIssues;
      
    } catch (error) {
      logger.error('Failed to get linked JIRA issues:', error);
      throw error;
    }
  }

  // Extract JIRA issue keys from PR data
  extractJiraIssueKeys(pr) {
    const keys = new Set();
    
    // Extract from title
    const titleKeys = pr.title.match(/[A-Z]+-\d+/g) || [];
    titleKeys.forEach(key => keys.add(key));
    
    // Extract from description
    const descKeys = (pr.body || '').match(/[A-Z]+-\d+/g) || [];
    descKeys.forEach(key => keys.add(key));
    
    // Extract from commit messages
    if (pr.commits) {
      pr.commits.forEach(commit => {
        const commitKeys = commit.message.match(/[A-Z]+-\d+/g) || [];
        commitKeys.forEach(key => keys.add(key));
      });
    }
    
    return Array.from(keys);
  }

  // Enrich pull request data with AI insights
  async enrichPullRequests(prs) {
    try {
      const enrichedPRs = [];
      
      for (const pr of prs) {
        try {
          // Get detailed PR information
          const detailedPR = await this.github.getPullRequest(pr.number);
          
          // Use AI to classify and analyze the PR
          const category = await this.openai.classifyPR(detailedPR);
          const summary = await this.openai.summarizePRChanges(detailedPR);
          const riskAnalysis = await this.openai.identifyRisks(detailedPR);
          
          const enrichedPR = {
            ...detailedPR,
            category,
            summary,
            riskAnalysis,
            enriched: true
          };
          
          enrichedPRs.push(enrichedPR);
          
        } catch (error) {
          logger.warn(`Failed to enrich PR ${pr.number}:`, error.message);
          // Add basic enrichment
          enrichedPRs.push({
            ...pr,
            category: 'Unknown',
            summary: pr.title,
            riskAnalysis: { riskLevel: 'unknown' },
            enriched: false
          });
        }
      }
      
      logger.info('Pull requests enriched successfully:', { count: enrichedPRs.length });
      return enrichedPRs;
      
    } catch (error) {
      logger.error('Failed to enrich pull requests:', error);
      throw error;
    }
  }

  // Enrich JIRA issues with additional context
  async enrichJiraIssues(issues) {
    try {
      const enrichedIssues = [];
      
      for (const issue of issues) {
        try {
          // Get issue transitions and comments for additional context
          const transitions = await this.jira.getIssueTransitions(issue.key);
          const comments = await this.jira.getIssueComments(issue.key);
          
          const enrichedIssue = {
            ...issue,
            transitions,
            comments,
            enriched: true
          };
          
          enrichedIssues.push(enrichedIssue);
          
        } catch (error) {
          logger.warn(`Failed to enrich JIRA issue ${issue.key}:`, error.message);
          // Add basic enrichment
          enrichedIssues.push({
            ...issue,
            transitions: [],
            comments: [],
            enriched: false
          });
        }
      }
      
      logger.info('JIRA issues enriched successfully:', { count: enrichedIssues.length });
      return enrichedIssues;
      
    } catch (error) {
      logger.error('Failed to enrich JIRA issues:', error);
      throw error;
    }
  }

  // Generate AI-powered insights from the data
  async generateInsights(prs, issues) {
    try {
      // Generate feature summary
      const featureSummary = await this.openai.generateFeatureSummary(prs, issues);
      
      // Collect all breaking changes
      const breakingChanges = [];
      prs.forEach(pr => {
        if (pr.riskAnalysis?.hasBreakingChanges) {
          breakingChanges.push(...pr.riskAnalysis.breakingChanges);
        }
      });
      
      // Generate migration notes if there are breaking changes
      let migrationNotes = null;
      if (breakingChanges.length > 0) {
        migrationNotes = await this.openai.generateMigrationNotes(breakingChanges);
      }
      
      // Calculate overall risk level
      const riskLevels = prs.map(pr => pr.riskAnalysis?.riskLevel).filter(Boolean);
      const overallRiskLevel = this.calculateOverallRiskLevel(riskLevels);
      
      // Group PRs by category
      const prsByCategory = this.groupPRsByCategory(prs);
      
      const insights = {
        featureSummary,
        breakingChanges,
        migrationNotes,
        overallRiskLevel,
        prsByCategory,
        totalChanges: prs.length + issues.length,
        riskDistribution: this.calculateRiskDistribution(prs),
        categoryDistribution: this.calculateCategoryDistribution(prs)
      };
      
      logger.info('Insights generated successfully');
      return insights;
      
    } catch (error) {
      logger.error('Failed to generate insights:', error);
      throw error;
    }
  }

  // Calculate overall risk level
  calculateOverallRiskLevel(riskLevels) {
    if (riskLevels.length === 0) return 'unknown';
    
    const riskScores = { low: 1, medium: 2, high: 3 };
    const totalScore = riskLevels.reduce((sum, level) => sum + (riskScores[level] || 0), 0);
    const averageScore = totalScore / riskLevels.length;
    
    if (averageScore >= 2.5) return 'high';
    if (averageScore >= 1.5) return 'medium';
    return 'low';
  }

  // Group PRs by category
  groupPRsByCategory(prs) {
    const grouped = {};
    
    prs.forEach(pr => {
      const category = pr.category || 'Unknown';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(pr);
    });
    
    return grouped;
  }

  // Calculate risk distribution
  calculateRiskDistribution(prs) {
    const distribution = { low: 0, medium: 0, high: 0, unknown: 0 };
    
    prs.forEach(pr => {
      const riskLevel = pr.riskAnalysis?.riskLevel || 'unknown';
      distribution[riskLevel]++;
    });
    
    return distribution;
  }

  // Calculate category distribution
  calculateCategoryDistribution(prs) {
    const distribution = {};
    
    prs.forEach(pr => {
      const category = pr.category || 'Unknown';
      distribution[category] = (distribution[category] || 0) + 1;
    });
    
    return distribution;
  }

  // Get release statistics
  async getReleaseStats(version) {
    try {
      const releaseData = await this.generateReleaseData(version);
      
      return {
        version,
        totalPRs: releaseData.pullRequests.length,
        totalIssues: releaseData.issues.length,
        breakingChanges: releaseData.insights.breakingChanges.length,
        riskLevel: releaseData.insights.overallRiskLevel,
        categoryBreakdown: releaseData.insights.categoryDistribution,
        riskBreakdown: releaseData.insights.riskDistribution,
        generatedAt: releaseData.metadata.generatedAt
      };
      
    } catch (error) {
      logger.error('Failed to get release stats:', error);
      throw error;
    }
  }
}

module.exports = ReleaseNotesGenerator;
