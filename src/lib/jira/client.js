const JiraApi = require('jira-client');
const logger = require('../utils/logger');

class JiraClient {
  constructor(config) {
    this.config = config;
    
    this.jira = new JiraApi({
      protocol: config.jira.protocol || 'https',
      host: config.jira.host,
      username: config.jira.username,
      password: config.jira.apiToken || config.jira.password,
      apiVersion: config.jira.apiVersion || '2',
      strictSSL: config.jira.strictSSL !== false,
      request: {
        timeout: config.jira.timeout || 30000
      }
    });

    this.projectKey = config.jira.projectKey;
    
    logger.logIntegration('jira', 'client_initialized', {
      host: config.jira.host,
      projectKey: this.projectKey,
      username: config.jira.username
    });
  }

  async testConnection() {
    try {
      const response = await this.jira.getCurrentUser();
      
      logger.logIntegration('jira', 'connection_test_success', {
        username: response.name,
        displayName: response.displayName,
        email: response.emailAddress
      });
      
      return {
        success: true,
        user: {
          username: response.name,
          displayName: response.displayName,
          email: response.emailAddress
        }
      };
    } catch (error) {
      logger.logError('JIRA connection test failed', error, {
        host: this.config.jira.host,
        username: this.config.jira.username
      });
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getIssue(issueKey) {
    try {
      const issue = await this.jira.findIssue(issueKey);
      
      logger.logIntegration('jira', 'issue_fetched', {
        issueKey,
        summary: issue.fields.summary,
        status: issue.fields.status.name
      });
      
      return issue;
    } catch (error) {
      logger.logError('Failed to fetch JIRA issue', error, {
        issueKey
      });
      throw error;
    }
  }

  async getIssuesByKeys(issueKeys) {
    try {
      if (!issueKeys || issueKeys.length === 0) {
        return [];
      }

      // JQL query to fetch multiple issues by key
      const jql = `issuekey in (${issueKeys.join(',')})`;
      const response = await this.searchIssues(jql, issueKeys.length);
      
      logger.logIntegration('jira', 'issues_by_keys_fetched', {
        issueKeys,
        count: response.issues.length
      });
      
      return response.issues;
    } catch (error) {
      logger.logError('Failed to fetch JIRA issues by keys', error, {
        issueKeys
      });
      throw error;
    }
  }

  async searchIssues(jql, maxResults = 100, fields = null) {
    try {
      const searchOptions = {
        jql,
        maxResults,
        fields: fields || [
          'summary',
          'description',
          'status',
          'assignee',
          'reporter',
          'created',
          'updated',
          'resolutiondate',
          'priority',
          'components',
          'labels',
          'issuetype',
          'project'
        ]
      };

      const response = await this.jira.searchJira(jql, searchOptions);
      
      logger.logIntegration('jira', 'issues_searched', {
        jql,
        total: response.total,
        count: response.issues.length
      });
      
      return response;
    } catch (error) {
      logger.logError('Failed to search JIRA issues', error, {
        jql,
        maxResults
      });
      throw error;
    }
  }

  async getIssuesByProject(projectKey = null, options = {}) {
    try {
      const project = projectKey || this.projectKey;
      const jql = `project = ${project}`;
      
      if (options.status) {
        jql += ` AND status = "${options.status}"`;
      }
      
      if (options.issueType) {
        jql += ` AND issuetype = "${options.issueType}"`;
      }
      
      if (options.updatedSince) {
        jql += ` AND updated >= "${options.updatedSince}"`;
      }
      
      if (options.assignee) {
        jql += ` AND assignee = "${options.assignee}"`;
      }
      
      const response = await this.searchIssues(jql, options.maxResults || 100);
      
      logger.logIntegration('jira', 'issues_by_project_fetched', {
        project,
        total: response.total,
        count: response.issues.length,
        filters: options
      });
      
      return response.issues;
    } catch (error) {
      logger.logError('Failed to fetch JIRA issues by project', error, {
        projectKey: projectKey || this.projectKey,
        options
      });
      throw error;
    }
  }

  async getIssueTransitions(issueKey) {
    try {
      const transitions = await this.jira.listTransitions(issueKey);
      
      logger.logIntegration('jira', 'issue_transitions_fetched', {
        issueKey,
        count: transitions.transitions.length
      });
      
      return transitions.transitions;
    } catch (error) {
      logger.logError('Failed to fetch JIRA issue transitions', error, {
        issueKey
      });
      throw error;
    }
  }

  async getIssueComments(issueKey) {
    try {
      const comments = await this.jira.getComments(issueKey);
      
      logger.logIntegration('jira', 'issue_comments_fetched', {
        issueKey,
        count: comments.comments.length
      });
      
      return comments.comments;
    } catch (error) {
      logger.logError('Failed to fetch JIRA issue comments', error, {
        issueKey
      });
      throw error;
    }
  }

  async getIssueWorklog(issueKey) {
    try {
      const worklog = await this.jira.getWorkLog(issueKey);
      
      logger.logIntegration('jira', 'issue_worklog_fetched', {
        issueKey,
        count: worklog.worklogs.length
      });
      
      return worklog.worklogs;
    } catch (error) {
      logger.logError('Failed to fetch JIRA issue worklog', error, {
        issueKey
      });
      throw error;
    }
  }

  async getProject(projectKey = null) {
    try {
      const project = projectKey || this.projectKey;
      const projectInfo = await this.jira.getProject(project);
      
      logger.logIntegration('jira', 'project_fetched', {
        projectKey: project,
        name: projectInfo.name,
        key: projectInfo.key
      });
      
      return projectInfo;
    } catch (error) {
      logger.logError('Failed to fetch JIRA project', error, {
        projectKey: projectKey || this.projectKey
      });
      throw error;
    }
  }

  async getProjectComponents(projectKey = null) {
    try {
      const project = projectKey || this.projectKey;
      const components = await this.jira.getProjectComponents(project);
      
      logger.logIntegration('jira', 'project_components_fetched', {
        projectKey: project,
        count: components.length
      });
      
      return components;
    } catch (error) {
      logger.logError('Failed to fetch JIRA project components', error, {
        projectKey: projectKey || this.projectKey
      });
      throw error;
    }
  }

  async getProjectVersions(projectKey = null) {
    try {
      const project = projectKey || this.projectKey;
      const versions = await this.jira.getProjectVersions(project);
      
      logger.logIntegration('jira', 'project_versions_fetched', {
        projectKey: project,
        count: versions.length
      });
      
      return versions;
    } catch (error) {
      logger.logError('Failed to fetch JIRA project versions', error, {
        projectKey: projectKey || this.projectKey
      });
      throw error;
    }
  }

  async getIssueTypes(projectKey = null) {
    try {
      const project = projectKey || this.projectKey;
      const issueTypes = await this.jira.getProjectIssueTypes(project);
      
      logger.logIntegration('jira', 'project_issue_types_fetched', {
        projectKey: project,
        count: issueTypes.length
      });
      
      return issueTypes;
    } catch (error) {
      logger.logError('Failed to fetch JIRA project issue types', error, {
        projectKey: projectKey || this.projectKey
      });
      throw error;
    }
  }

  async createIssue(issueData) {
    try {
      const issue = await this.jira.createIssue(issueData);
      
      logger.logIntegration('jira', 'issue_created', {
        issueKey: issue.key,
        summary: issueData.fields.summary,
        project: issueData.fields.project.key
      });
      
      return issue;
    } catch (error) {
      logger.logError('Failed to create JIRA issue', error, {
        issueData
      });
      throw error;
    }
  }

  async updateIssue(issueKey, updateData) {
    try {
      await this.jira.updateIssue(issueKey, updateData);
      
      logger.logIntegration('jira', 'issue_updated', {
        issueKey,
        updateData
      });
      
      return { success: true, issueKey };
    } catch (error) {
      logger.logError('Failed to update JIRA issue', error, {
        issueKey,
        updateData
      });
      throw error;
    }
  }

  async addComment(issueKey, comment) {
    try {
      const newComment = await this.jira.addComment(issueKey, comment);
      
      logger.logIntegration('jira', 'comment_added', {
        issueKey,
        commentId: newComment.id
      });
      
      return newComment;
    } catch (error) {
      logger.logError('Failed to add JIRA comment', error, {
        issueKey,
        comment
      });
      throw error;
    }
  }

  async transitionIssue(issueKey, transitionId, transitionData = {}) {
    try {
      await this.jira.transitionIssue(issueKey, {
        transition: { id: transitionId },
        ...transitionData
      });
      
      logger.logIntegration('jira', 'issue_transitioned', {
        issueKey,
        transitionId,
        transitionData
      });
      
      return { success: true, issueKey, transitionId };
    } catch (error) {
      logger.logError('Failed to transition JIRA issue', error, {
        issueKey,
        transitionId,
        transitionData
      });
      throw error;
    }
  }

  async isConfigured() {
    return !!(
      this.config.jira.host &&
      this.config.jira.username &&
      (this.config.jira.apiToken || this.config.jira.password) &&
      this.projectKey
    );
  }

  getHealthStatus() {
    return {
      service: 'jira',
      configured: this.isConfigured(),
      host: this.config.jira.host,
      projectKey: this.projectKey,
      username: this.config.jira.username,
      hasAuth: !!(this.config.jira.apiToken || this.config.jira.password)
    };
  }
}

module.exports = JiraClient;
