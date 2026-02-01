const logger = require('../../lib/utils/logger');

class ReleaseNotesFormatter {
  constructor() {
    logger.info('ReleaseNotesFormatter initialized');
  }

  // Format release notes in the specified format
  async formatReleaseNotes(releaseData, format = 'markdown') {
    try {
      logger.info('Formatting release notes:', { format });
      
      switch (format.toLowerCase()) {
        case 'markdown':
          return this.formatAsMarkdown(releaseData);
        case 'html':
          return this.formatAsHTML(releaseData);
        case 'teams':
          return this.formatForTeams(releaseData);
        case 'confluence':
          return this.formatForConfluence(releaseData);
        case 'json':
          return this.formatAsJSON(releaseData);
        default:
          throw new Error(`Unsupported format: ${format}`);
      }
    } catch (error) {
      logger.error('Failed to format release notes:', error);
      throw error;
    }
  }

  // Format as Markdown
  formatAsMarkdown(releaseData) {
    try {
      const { version, releaseDate, previousVersion, pullRequests, issues, insights } = releaseData;
      
      let markdown = `# Release Notes - ${version}\n\n`;
      
      // Header information
      markdown += `**Release Date:** ${new Date(releaseDate).toLocaleDateString()}\n`;
      if (previousVersion) {
        markdown += `**Previous Version:** ${previousVersion}\n`;
      }
      markdown += `**Total Changes:** ${insights.totalChanges}\n`;
      markdown += `**Risk Level:** ${this.getRiskLevelBadge(insights.overallRiskLevel)}\n\n`;
      
      // Feature summary
      if (insights.featureSummary) {
        markdown += `## 🚀 What's New\n\n`;
        markdown += `${insights.featureSummary}\n\n`;
      }
      
      // Breaking changes
      if (insights.breakingChanges && insights.breakingChanges.length > 0) {
        markdown += `## ⚠️ Breaking Changes\n\n`;
        insights.breakingChanges.forEach(change => {
          markdown += `- ${change}\n`;
        });
        markdown += `\n`;
        
        // Migration notes
        if (insights.migrationNotes) {
          markdown += `### Migration Guide\n\n`;
          markdown += `${insights.migrationNotes}\n\n`;
        }
      }
      
      // Changes by category
      markdown += `## 📋 Changes by Category\n\n`;
      
      Object.entries(insights.prsByCategory).forEach(([category, prs]) => {
        if (prs.length > 0) {
          markdown += `### ${this.getCategoryIcon(category)} ${category} (${prs.length})\n\n`;
          
          prs.forEach(pr => {
            const riskBadge = this.getRiskLevelBadge(pr.riskAnalysis?.riskLevel || 'unknown');
            markdown += `- **${pr.title}** ${riskBadge}\n`;
            if (pr.summary && pr.summary !== pr.title) {
              markdown += `  - ${pr.summary}\n`;
            }
            markdown += `  - PR #${pr.number} by @${pr.user?.login || 'unknown'}\n`;
          });
          markdown += `\n`;
        }
      });
      
      // JIRA issues
      if (issues && issues.length > 0) {
        markdown += `## 🎫 Related Issues\n\n`;
        issues.forEach(issue => {
          markdown += `- **[${issue.key}]** ${issue.fields?.summary || 'No summary'}\n`;
          markdown += `  - Status: ${issue.fields?.status?.name || 'Unknown'}\n`;
          markdown += `  - Type: ${issue.fields?.issuetype?.name || 'Unknown'}\n`;
        });
        markdown += `\n`;
      }
      
      // Risk analysis
      markdown += `## 🔍 Risk Analysis\n\n`;
      markdown += `**Overall Risk Level:** ${this.getRiskLevelBadge(insights.overallRiskLevel)}\n\n`;
      
      Object.entries(insights.riskDistribution).forEach(([level, count]) => {
        if (count > 0) {
          markdown += `- ${this.getRiskLevelBadge(level)}: ${count} changes\n`;
        }
      });
      markdown += `\n`;
      
      // Footer
      markdown += `---\n`;
      markdown += `*Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}*\n`;
      
      logger.info('Release notes formatted as Markdown successfully');
      return markdown;
      
    } catch (error) {
      logger.error('Failed to format as Markdown:', error);
      throw error;
    }
  }

  // Format as HTML
  formatAsHTML(releaseData) {
    try {
      const { version, releaseDate, previousVersion, pullRequests, issues, insights } = releaseData;
      
      let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Release Notes - ${version}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background: #f6f8fa; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #24292e; border-bottom: 2px solid #e1e4e8; padding-bottom: 10px; }
        h2 { color: #24292e; margin-top: 30px; }
        h3 { color: #586069; }
        .badge { display: inline-block; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
        .badge-low { background: #d4edda; color: #155724; }
        .badge-medium { background: #fff3cd; color: #856404; }
        .badge-high { background: #f8d7da; color: #721c24; }
        .badge-unknown { background: #e2e3e5; color: #383d41; }
        .header-info { background: #f6f8fa; padding: 15px; border-radius: 6px; margin: 20px 0; }
        .pr-item { margin: 10px 0; padding: 10px; border-left: 4px solid #e1e4e8; background: #fafbfc; }
        .pr-title { font-weight: 600; color: #24292e; }
        .pr-summary { color: #586069; margin: 5px 0; }
        .pr-meta { font-size: 12px; color: #6a737d; }
        .category-section { margin: 20px 0; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e1e4e8; color: #6a737d; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Release Notes - ${version}</h1>`;
      
      // Header information
      html += `
        <div class="header-info">
            <strong>Release Date:</strong> ${new Date(releaseDate).toLocaleDateString()}<br>`;
      if (previousVersion) {
        html += `<strong>Previous Version:</strong> ${previousVersion}<br>`;
      }
      html += `
            <strong>Total Changes:</strong> ${insights.totalChanges}<br>
            <strong>Risk Level:</strong> ${this.getRiskLevelBadgeHTML(insights.overallRiskLevel)}
        </div>`;
      
      // Feature summary
      if (insights.featureSummary) {
        html += `
        <h2>🚀 What's New</h2>
        <p>${insights.featureSummary}</p>`;
      }
      
      // Breaking changes
      if (insights.breakingChanges && insights.breakingChanges.length > 0) {
        html += `
        <h2>⚠️ Breaking Changes</h2>
        <ul>`;
        insights.breakingChanges.forEach(change => {
          html += `<li>${change}</li>`;
        });
        html += `</ul>`;
        
        if (insights.migrationNotes) {
          html += `
          <h3>Migration Guide</h3>
          <div style="background: #fff3cd; padding: 15px; border-radius: 6px; border-left: 4px solid #ffc107;">
              ${insights.migrationNotes}
          </div>`;
        }
      }
      
      // Changes by category
      html += `
        <h2>📋 Changes by Category</h2>`;
      
      Object.entries(insights.prsByCategory).forEach(([category, prs]) => {
        if (prs.length > 0) {
          html += `
          <div class="category-section">
              <h3>${this.getCategoryIcon(category)} ${category} (${prs.length})</h3>`;
          
          prs.forEach(pr => {
            const riskBadge = this.getRiskLevelBadgeHTML(pr.riskAnalysis?.riskLevel || 'unknown');
            html += `
              <div class="pr-item">
                  <div class="pr-title">${pr.title} ${riskBadge}</div>`;
            if (pr.summary && pr.summary !== pr.title) {
              html += `<div class="pr-summary">${pr.summary}</div>`;
            }
            html += `
                  <div class="pr-meta">PR #${pr.number} by @${pr.user?.login || 'unknown'}</div>
              </div>`;
          });
          
          html += `</div>`;
        }
      });
      
      // Risk analysis
      html += `
        <h2>🔍 Risk Analysis</h2>
        <p><strong>Overall Risk Level:</strong> ${this.getRiskLevelBadgeHTML(insights.overallRiskLevel)}</p>
        <ul>`;
      
      Object.entries(insights.riskDistribution).forEach(([level, count]) => {
        if (count > 0) {
          html += `<li>${this.getRiskLevelBadgeHTML(level)}: ${count} changes</li>`;
        }
      });
      
      html += `</ul>`;
      
      // Footer
      html += `
        <div class="footer">
            Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
        </div>
    </div>
</body>
</html>`;
      
      logger.info('Release notes formatted as HTML successfully');
      return html;
      
    } catch (error) {
      logger.error('Failed to format as HTML:', error);
      throw error;
    }
  }

  // Format for Microsoft Teams
  formatForTeams(releaseData) {
    try {
      const { version, releaseDate, previousVersion, pullRequests, issues, insights } = releaseData;
      
      const teamsCard = {
        "@type": "MessageCard",
        "@context": "http://schema.org/extensions",
        "themeColor": this.getThemeColor(insights.overallRiskLevel),
        "summary": `Release Notes - ${version}`,
        "sections": [
          {
            "activityTitle": `🚀 Release Notes - ${version}`,
            "activitySubtitle": `Released on ${new Date(releaseDate).toLocaleDateString()}`,
            "facts": [
              {
                "name": "Total Changes",
                "value": insights.totalChanges.toString()
              },
              {
                "name": "Risk Level",
                "value": insights.overallRiskLevel.toUpperCase()
              }
            ]
          }
        ]
      };
      
      // Add breaking changes section if any
      if (insights.breakingChanges && insights.breakingChanges.length > 0) {
        teamsCard.sections.push({
          "title": "⚠️ Breaking Changes",
          "text": insights.breakingChanges.map(change => `• ${change}`).join('\n')
        });
      }
      
      // Add feature summary
      if (insights.featureSummary) {
        teamsCard.sections.push({
          "title": "🚀 What's New",
          "text": insights.featureSummary
        });
      }
      
      // Add category summary
      const categorySummary = Object.entries(insights.prsByCategory)
        .map(([category, prs]) => `${this.getCategoryIcon(category)} ${category}: ${prs.length}`)
        .join('\n');
      
      teamsCard.sections.push({
        "title": "📋 Changes by Category",
        "text": categorySummary
      });
      
      logger.info('Release notes formatted for Teams successfully');
      return teamsCard;
      
    } catch (error) {
      logger.error('Failed to format for Teams:', error);
      throw error;
    }
  }

  // Format for Confluence
  formatForConfluence(releaseData) {
    try {
      // Confluence uses a subset of HTML with specific formatting
      const html = this.formatAsHTML(releaseData);
      
      // Convert to Confluence-compatible format
      let confluence = html
        .replace(/<style>[\s\S]*?<\/style>/g, '') // Remove CSS
        .replace(/<html>[\s\S]*?<body>/, '') // Remove HTML wrapper
        .replace(/<\/body>[\s\S]*?<\/html>/, '') // Remove closing tags
        .replace(/class="[^"]*"/g, '') // Remove class attributes
        .replace(/style="[^"]*"/g, ''); // Remove style attributes
      
      logger.info('Release notes formatted for Confluence successfully');
      return confluence;
      
    } catch (error) {
      logger.error('Failed to format for Confluence:', error);
      throw error;
    }
  }

  // Format as JSON
  formatAsJSON(releaseData) {
    try {
      logger.info('Release notes formatted as JSON successfully');
      return JSON.stringify(releaseData, null, 2);
    } catch (error) {
      logger.error('Failed to format as JSON:', error);
      throw error;
    }
  }

  // Helper methods
  getRiskLevelBadge(level) {
    const badges = {
      low: '🟢 Low Risk',
      medium: '🟡 Medium Risk',
      high: '🔴 High Risk',
      unknown: '⚪ Unknown Risk'
    };
    return badges[level] || badges.unknown;
  }

  getRiskLevelBadgeHTML(level) {
    const badges = {
      low: '<span class="badge badge-low">Low Risk</span>',
      medium: '<span class="badge badge-medium">Medium Risk</span>',
      high: '<span class="badge badge-high">High Risk</span>',
      unknown: '<span class="badge badge-unknown">Unknown Risk</span>'
    };
    return badges[level] || badges.unknown;
  }

  getCategoryIcon(category) {
    const icons = {
      'Feature': '✨',
      'Bug Fix': '🐛',
      'Performance': '⚡',
      'Security': '🔒',
      'Documentation': '📚',
      'Infrastructure': '🏗️',
      'Refactor': '🔧',
      'Test': '🧪'
    };
    return icons[category] || '📝';
  }

  getThemeColor(riskLevel) {
    const colors = {
      low: '00FF00',
      medium: 'FFA500',
      high: 'FF0000',
      unknown: '808080'
    };
    return colors[riskLevel] || colors.unknown;
  }
}

module.exports = ReleaseNotesFormatter;
