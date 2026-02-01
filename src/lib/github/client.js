const { Octokit } = require('@octokit/rest');
const logger = require('../utils/logger');

class GitHubClient {
  constructor(config) {
    this.config = config;
    this.octokit = new Octokit({
      auth: config.github.token,
      baseUrl: config.github.apiUrl || 'https://api.github.com',
      userAgent: 'AI-Tools-Suite-ReleaseNotes'
    });
    
    this.owner = config.github.owner;
    this.repo = config.github.repo;
    
    logger.logIntegration('github', 'client_initialized', {
      owner: this.owner,
      repo: this.repo,
      apiUrl: config.github.apiUrl
    });
  }

  async testConnection() {
    try {
      const response = await this.octokit.repos.get({
        owner: this.owner,
        repo: this.repo
      });
      
      logger.logIntegration('github', 'connection_test_success', {
        repo: response.data.full_name,
        description: response.data.description
      });
      
      return {
        success: true,
        repo: response.data.full_name,
        description: response.data.description
      };
    } catch (error) {
      logger.logError('GitHub connection test failed', error, {
        owner: this.owner,
        repo: this.repo
      });
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getReleases(options = {}) {
    try {
      const response = await this.octokit.repos.listReleases({
        owner: this.owner,
        repo: this.repo,
        per_page: options.per_page || 100,
        page: options.page || 1
      });

      logger.logIntegration('github', 'releases_fetched', {
        count: response.data.length,
        page: options.page || 1
      });

      return response.data;
    } catch (error) {
      logger.logError('Failed to fetch GitHub releases', error, {
        owner: this.owner,
        repo: this.repo,
        options
      });
      throw error;
    }
  }

  async getReleaseByTag(tag) {
    try {
      const response = await this.octokit.repos.getReleaseByTag({
        owner: this.owner,
        repo: this.repo,
        tag: tag
      });

      logger.logIntegration('github', 'release_by_tag_fetched', {
        tag: tag,
        releaseId: response.data.id
      });

      return response.data;
    } catch (error) {
      logger.logError('Failed to fetch GitHub release by tag', error, {
        owner: this.owner,
        repo: this.repo,
        tag: tag
      });
      throw error;
    }
  }

  async getMergedPRs(fromTag, toTag, options = {}) {
    try {
      // Get commits between tags
      const commits = await this.getCommitsBetweenTags(fromTag, toTag);
      
      // Get PRs for these commits
      const prs = [];
      const seenPRs = new Set();

      for (const commit of commits) {
        const commitPRs = await this.getPRsForCommit(commit.sha);
        
        for (const pr of commitPRs) {
          if (!seenPRs.has(pr.number) && pr.merged_at) {
            seenPRs.add(pr.number);
            prs.push(pr);
          }
        }
      }

      // Sort by merge date
      prs.sort((a, b) => new Date(a.merged_at) - new Date(b.merged_at));

      logger.logIntegration('github', 'merged_prs_fetched', {
        fromTag,
        toTag,
        count: prs.length
      });

      return prs;
    } catch (error) {
      logger.logError('Failed to fetch merged PRs between tags', error, {
        owner: this.owner,
        repo: this.repo,
        fromTag,
        toTag
      });
      throw error;
    }
  }

  async getMergedPRsByDateRange(startDate, endDate, options = {}) {
    try {
      const response = await this.octokit.pulls.list({
        owner: this.owner,
        repo: this.repo,
        state: 'closed',
        sort: 'updated',
        direction: 'desc',
        per_page: options.per_page || 100,
        page: options.page || 1
      });

      // Filter PRs merged within the date range
      const filteredPRs = response.data.filter(pr => 
        pr.merged_at && 
        new Date(pr.merged_at) >= new Date(startDate) &&
        new Date(pr.merged_at) <= new Date(endDate)
      );

      logger.logIntegration('github', 'merged_prs_by_date_fetched', {
        startDate,
        endDate,
        totalCount: response.data.length,
        filteredCount: filteredPRs.length
      });

      return filteredPRs;
    } catch (error) {
      logger.logError('Failed to fetch merged PRs by date range', error, {
        owner: this.owner,
        repo: this.repo,
        startDate,
        endDate
      });
      throw error;
    }
  }

  async getCommitsBetweenTags(fromTag, toTag) {
    try {
      const response = await this.octokit.repos.compareCommits({
        owner: this.owner,
        repo: this.repo,
        base: fromTag,
        head: toTag
      });

      logger.logIntegration('github', 'commits_between_tags_fetched', {
        fromTag,
        toTag,
        count: response.data.commits.length
      });

      return response.data.commits;
    } catch (error) {
      logger.logError('Failed to fetch commits between tags', error, {
        owner: this.owner,
        repo: this.repo,
        fromTag,
        toTag
      });
      throw error;
    }
  }

  async getPRsForCommit(commitSha) {
    try {
      const response = await this.octokit.repos.listPullRequestsAssociatedWithCommit({
        owner: this.owner,
        repo: this.repo,
        commit_sha: commitSha
      });

      return response.data;
    } catch (error) {
      logger.logError('Failed to fetch PRs for commit', error, {
        owner: this.owner,
        repo: this.repo,
        commitSha
      });
      return [];
    }
  }

  async getPRDetails(prNumber) {
    try {
      const response = await this.octokit.pulls.get({
        owner: this.owner,
        repo: this.repo,
        pull_number: prNumber
      });

      return response.data;
    } catch (error) {
      logger.logError('Failed to fetch PR details', error, {
        owner: this.owner,
        repo: this.repo,
        prNumber
      });
      throw error;
    }
  }

  async getPRCommits(prNumber) {
    try {
      const response = await this.octokit.pulls.listCommits({
        owner: this.owner,
        repo: this.repo,
        pull_number: prNumber,
        per_page: 100
      });

      return response.data;
    } catch (error) {
      logger.logError('Failed to fetch PR commits', error, {
        owner: this.owner,
        repo: this.repo,
        prNumber
      });
      throw error;
    }
  }

  async getPRFiles(prNumber) {
    try {
      const response = await this.octokit.pulls.listFiles({
        owner: this.owner,
        repo: this.repo,
        pull_number: prNumber,
        per_page: 100
      });

      return response.data;
    } catch (error) {
      logger.logError('Failed to fetch PR files', error, {
        owner: this.owner,
        repo: this.repo,
        prNumber
      });
      throw error;
    }
  }

  async getRepositoryInfo() {
    try {
      const response = await this.octokit.repos.get({
        owner: this.owner,
        repo: this.repo
      });

      return {
        name: response.data.name,
        fullName: response.data.full_name,
        description: response.data.description,
        language: response.data.language,
        topics: response.data.topics || [],
        defaultBranch: response.data.default_branch,
        createdAt: response.data.created_at,
        updatedAt: response.data.updated_at
      };
    } catch (error) {
      logger.logError('Failed to fetch repository info', error, {
        owner: this.owner,
        repo: this.repo
      });
      throw error;
    }
  }

  async isConfigured() {
    return !!(this.config.github.token && this.owner && this.repo);
  }

  getHealthStatus() {
    return {
      service: 'github',
      configured: this.isConfigured(),
      owner: this.owner,
      repo: this.repo,
      hasToken: !!this.config.github.token
    };
  }
}

module.exports = GitHubClient;
