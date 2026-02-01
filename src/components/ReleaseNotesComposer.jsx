import React, { useState, useEffect } from 'react';
import { logger } from '../lib/utils/logger';

const ReleaseNotesComposer = () => {
  const [version, setVersion] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [options, setOptions] = useState({
    includeBreakingChanges: true,
    includeMigrationNotes: true,
    includePerformanceMetrics: true,
    format: 'markdown'
  });
  const [loading, setLoading] = useState(false);
  const [releaseData, setReleaseData] = useState(null);
  const [error, setError] = useState(null);
  const [configStatus, setConfigStatus] = useState(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || process.env.API_BASE_URL || 'http://localhost:3001/api/v1';

  useEffect(() => {
    checkConfigStatus();
  }, []);

  const checkConfigStatus = async () => {
    try {
      const response = await fetch(`${API_BASE}/config/validate`);
      const data = await response.json();
      setConfigStatus(data);
    } catch (error) {
      logger.error('Failed to check config status', error);
      setConfigStatus({ isValid: false, error: error.message });
    }
  };

  const generateReleaseNotes = async () => {
    if (!version) {
      setError('Version is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/release-notes/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ version, options }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate release notes');
      }

      setReleaseData(data.data);
      logger.info('Release notes generated successfully', { version, data: data.data });
    } catch (error) {
      logger.error('Failed to generate release notes', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const generateLatestReleaseNotes = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/release-notes/generate-latest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ options }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate latest release notes');
      }

      setReleaseData(data.data);
      setVersion(data.data.version || 'latest');
      logger.info('Latest release notes generated successfully', { data: data.data });
    } catch (error) {
      logger.error('Failed to generate latest release notes', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const generateDateRangeReleaseNotes = async () => {
    if (!startDate || !endDate) {
      setError('Start and end dates are required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/release-notes/generate-date-range`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ startDate, endDate, options }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate date range release notes');
      }

      setReleaseData(data.data);
      logger.info('Date range release notes generated successfully', { startDate, endDate, data: data.data });
    } catch (error) {
      logger.error('Failed to generate date range release notes', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const sendToTeams = async () => {
    if (!releaseData) {
      setError('No release data to send');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/release-notes/send-to-teams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ version: releaseData.version, format: options.format }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send to Teams');
      }

      logger.info('Release notes sent to Teams successfully', { version: releaseData.version });
      alert('Release notes sent to Teams successfully!');
    } catch (error) {
      logger.error('Failed to send to Teams', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadReleaseNotes = (format) => {
    if (!releaseData) return;

    let content = '';
    let filename = `release-notes-${releaseData.version}.${format}`;

    if (format === 'json') {
      content = JSON.stringify(releaseData, null, 2);
    } else if (format === 'markdown') {
      content = formatAsMarkdown(releaseData);
    } else if (format === 'html') {
      content = formatAsHTML(releaseData);
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatAsMarkdown = (data) => {
    return `# Release Notes - ${data.version}

## Summary
${data.summary || 'No summary available'}

## Risk Level: ${data.overallRiskLevel || 'Unknown'}

## Pull Requests (${data.pullRequests?.length || 0})
${data.pullRequests?.map(pr => `- ${pr.title} (#${pr.number}) - ${pr.riskLevel || 'Low Risk'}`).join('\n') || 'No PRs found'}

## Breaking Changes
${data.breakingChanges?.length ? data.breakingChanges.map(change => `- ${change.description}`).join('\n') : 'No breaking changes detected'}

## Migration Notes
${data.migrationNotes?.length ? data.migrationNotes.map(note => `- ${note.description}`).join('\n') : 'No migration notes required'}

Generated on: ${new Date().toLocaleString()}
`;
  };

  const formatAsHTML = (data) => {
    return `<!DOCTYPE html>
<html>
<head>
    <title>Release Notes - ${data.version}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .risk-high { color: #d32f2f; }
        .risk-medium { color: #f57c00; }
        .risk-low { color: #388e3c; }
        .breaking-change { background-color: #ffebee; padding: 10px; border-left: 4px solid #d32f2f; margin: 10px 0; }
    </style>
</head>
<body>
    <h1>Release Notes - ${data.version}</h1>
    <p><strong>Summary:</strong> ${data.summary || 'No summary available'}</p>
    <p><strong>Risk Level:</strong> <span class="risk-${data.overallRiskLevel?.toLowerCase() || 'low'}">${data.overallRiskLevel || 'Unknown'}</span></p>
    
    <h2>Pull Requests (${data.pullRequests?.length || 0})</h2>
    <ul>
        ${data.pullRequests?.map(pr => `<li>${pr.title} (#${pr.number}) - <span class="risk-${pr.riskLevel?.toLowerCase() || 'low'}">${pr.riskLevel || 'Low Risk'}</span></li>`).join('') || '<li>No PRs found</li>'}
    </ul>
    
    <h2>Breaking Changes</h2>
    ${data.breakingChanges?.length ? data.breakingChanges.map(change => `<div class="breaking-change"><strong>⚠️ Breaking Change:</strong> ${change.description}</div>`).join('') : '<p>No breaking changes detected</p>'}
    
    <h2>Migration Notes</h2>
    ${data.migrationNotes?.length ? `<ul>${data.migrationNotes.map(note => `<li>${note.description}</li>`).join('')}</ul>` : '<p>No migration notes required</p>'}
    
    <p><em>Generated on: ${new Date().toLocaleString()}</em></p>
</body>
</html>`;
  };

  return (
    <div className="release-notes-composer">
      <div className="header">
        <h1>🚀 Release Notes Composer</h1>
        <p>Automatically generate customer-ready release notes from GitHub PRs and JIRA tickets</p>
      </div>

      {/* Configuration Status */}
      {configStatus && (
        <div className={`config-status ${configStatus.isValid ? 'valid' : 'invalid'}`}>
          <h3>Configuration Status</h3>
          {configStatus.isValid ? (
            <p>✅ All integrations configured and ready</p>
          ) : (
            <div>
              <p>❌ Configuration incomplete</p>
              {configStatus.missingVars && (
                <ul>
                  {configStatus.missingVars.map((varName, index) => (
                    <li key={index}>{varName}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {/* Input Form */}
      <div className="input-section">
        <div className="form-group">
          <label htmlFor="version">Version:</label>
          <input
            type="text"
            id="version"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            placeholder="e.g., v1.2.0"
          />
        </div>

        <div className="form-group">
          <label htmlFor="startDate">Start Date:</label>
          <input
            type="date"
            id="startDate"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="endDate">End Date:</label>
          <input
            type="date"
            id="endDate"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <div className="options-section">
          <h4>Options:</h4>
          <label>
            <input
              type="checkbox"
              checked={options.includeBreakingChanges}
              onChange={(e) => setOptions({ ...options, includeBreakingChanges: e.target.checked })}
            />
            Include Breaking Changes
          </label>
          <label>
            <input
              type="checkbox"
              checked={options.includeMigrationNotes}
              onChange={(e) => setOptions({ ...options, includeMigrationNotes: e.target.checked })}
            />
            Include Migration Notes
          </label>
          <label>
            <input
              type="checkbox"
              checked={options.includePerformanceMetrics}
              onChange={(e) => setOptions({ ...options, includePerformanceMetrics: e.target.checked })}
            />
            Include Performance Metrics
          </label>
          <label>
            Format:
            <select
              value={options.format}
              onChange={(e) => setOptions({ ...options, format: e.target.value })}
            >
              <option value="markdown">Markdown</option>
              <option value="html">HTML</option>
              <option value="json">JSON</option>
            </select>
          </label>
        </div>

        <div className="actions">
          <button
            onClick={generateReleaseNotes}
            disabled={loading || !version}
            className="btn btn-primary"
          >
            {loading ? 'Generating...' : 'Generate Release Notes'}
          </button>
          <button
            onClick={generateLatestReleaseNotes}
            disabled={loading}
            className="btn btn-secondary"
          >
            {loading ? 'Generating...' : 'Generate Latest'}
          </button>
          <button
            onClick={generateDateRangeReleaseNotes}
            disabled={loading || !startDate || !endDate}
            className="btn btn-secondary"
          >
            {loading ? 'Generating...' : 'Generate by Date Range'}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-message">
          <h3>❌ Error</h3>
          <p>{error}</p>
        </div>
      )}

      {/* Results Display */}
      {releaseData && (
        <div className="results-section">
          <h3>Generated Release Notes</h3>
          
          <div className="release-summary">
            <h4>Summary</h4>
            <p><strong>Version:</strong> {releaseData.version}</p>
            <p><strong>Risk Level:</strong> <span className={`risk-${releaseData.overallRiskLevel?.toLowerCase() || 'low'}`}>{releaseData.overallRiskLevel || 'Unknown'}</span></p>
            <p><strong>Pull Requests:</strong> {releaseData.pullRequests?.length || 0}</p>
            <p><strong>Breaking Changes:</strong> {releaseData.breakingChanges?.length || 0}</p>
          </div>

          <div className="actions">
            <button onClick={() => downloadReleaseNotes('markdown')} className="btn btn-secondary">
              Download Markdown
            </button>
            <button onClick={() => downloadReleaseNotes('html')} className="btn btn-secondary">
              Download HTML
            </button>
            <button onClick={() => downloadReleaseNotes('json')} className="btn btn-secondary">
              Download JSON
            </button>
            <button onClick={sendToTeams} disabled={loading} className="btn btn-primary">
              {loading ? 'Sending...' : 'Send to Teams'}
            </button>
          </div>

          {/* Raw Data Preview */}
          <details>
            <summary>View Raw Data</summary>
            <pre>{JSON.stringify(releaseData, null, 2)}</pre>
          </details>
        </div>
      )}

      <style jsx>{`
        .release-notes-composer {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .header {
          text-align: center;
          margin-bottom: 40px;
        }

        .header h1 {
          color: #2c3e50;
          margin-bottom: 10px;
        }

        .config-status {
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .config-status.valid {
          background-color: #d4edda;
          border: 1px solid #c3e6cb;
          color: #155724;
        }

        .config-status.invalid {
          background-color: #f8d7da;
          border: 1px solid #f5c6cb;
          color: #721c24;
        }

        .input-section {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .form-group {
          margin-bottom: 15px;
        }

        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: 600;
          color: #495057;
        }

        .form-group input,
        .form-group select {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #ced4da;
          border-radius: 4px;
          font-size: 14px;
        }

        .options-section {
          margin: 20px 0;
          padding: 15px;
          background: white;
          border-radius: 4px;
        }

        .options-section h4 {
          margin-top: 0;
          margin-bottom: 15px;
          color: #495057;
        }

        .options-section label {
          display: block;
          margin-bottom: 10px;
          cursor: pointer;
        }

        .options-section input[type="checkbox"] {
          margin-right: 8px;
        }

        .actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 20px;
        }

        .btn {
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.2s;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-primary {
          background-color: #007bff;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background-color: #0056b3;
        }

        .btn-secondary {
          background-color: #6c757d;
          color: white;
        }

        .btn-secondary:hover:not(:disabled) {
          background-color: #545b62;
        }

        .error-message {
          background-color: #f8d7da;
          border: 1px solid #f5c6cb;
          color: #721c24;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .results-section {
          background: white;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          padding: 20px;
          margin-top: 20px;
        }

        .release-summary {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 4px;
          margin-bottom: 20px;
        }

        .risk-high { color: #d32f2f; font-weight: 600; }
        .risk-medium { color: #f57c00; font-weight: 600; }
        .risk-low { color: #388e3c; font-weight: 600; }

        details {
          margin-top: 20px;
        }

        details summary {
          cursor: pointer;
          font-weight: 600;
          color: #495057;
          margin-bottom: 10px;
        }

        pre {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 4px;
          overflow-x: auto;
          font-size: 12px;
        }
      `}</style>
    </div>
  );
};

export default ReleaseNotesComposer;
