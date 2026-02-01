/**
 * AI Release Risk Manager
 * Evaluates error budgets, performance budgets, and feature flag ramp safety
 */

/**
 * Evaluate error budget trend over time
 * @param {Array} errorTimeseries - Array of {ts, errors, requests} objects
 * @param {number} sloTarget - SLO target percentage (e.g., 99.9)
 * @returns {Object} - {pass: boolean, recent: Array} with availability data
 */
export function evaluateErrorBudget(errorTimeseries, sloTarget = 99.9) {
  const points = errorTimeseries.map(p => {
    const avail = 100 * (1 - (p.errors / Math.max(1, p.requests)));
    return { ts: p.ts, availability: +avail.toFixed(5) };
  });
  
  const recent = points.slice(-5);
  const pass = recent.every(p => p.availability >= sloTarget);
  
  return { 
    pass, 
    recent,
    overall: {
      avg: +(points.reduce((sum, p) => sum + p.availability, 0) / points.length).toFixed(3),
      trend: points.length >= 2 ? +(points[points.length - 1].availability - points[0].availability).toFixed(3) : 0
    }
  };
}

/**
 * Evaluate performance budget compliance
 * @param {Object} perf - Performance metrics { LCP_ms, CLS, TBT_ms }
 * @param {Object} budget - Budget thresholds { LCP_ms: 2500, CLS: 0.1, TBT_ms: 200 }
 * @returns {Object} - {pass: boolean, checks: Object, score: number}
 */
export function evaluatePerfBudget(perf, budget = { LCP_ms: 2500, CLS: 0.1, TBT_ms: 200 }) {
  const checks = {
    LCP: perf.LCP_ms <= budget.LCP_ms,
    CLS: perf.CLS <= budget.CLS,
    TBT: perf.TBT_ms <= budget.TBT_ms
  };
  
  const pass = Object.values(checks).every(Boolean);
  const score = Object.values(checks).filter(Boolean).length / Object.keys(checks).length * 100;
  
  return { 
    pass, 
    checks,
    score: +score.toFixed(1),
    details: {
      LCP: { value: perf.LCP_ms, budget: budget.LCP_ms, status: checks.LCP ? 'PASS' : 'FAIL' },
      CLS: { value: perf.CLS, budget: budget.CLS, status: checks.CLS ? 'PASS' : 'FAIL' },
      TBT: { value: perf.TBT_ms, budget: budget.TBT_ms, status: checks.TBT ? 'PASS' : 'FAIL' }
    }
  };
}

/**
 * Detect feature flag ramp anomalies (sudden jumps > maxStep)
 * @param {Array} flags - Array of {name, ramp: [{step, pct}]} objects
 * @param {number} maxStep - Maximum allowed percentage jump between steps
 * @returns {Array} - Array of detected anomalies
 */
export function detectFlagRampAnomalies(flags, maxStep = 25) {
  const out = [];
  
  for (const f of flags) {
    for (let i = 1; i < f.ramp.length; i++) {
      const d = f.ramp[i].pct - f.ramp[i - 1].pct;
      if (d > maxStep) {
        out.push({
          flag: f.name,
          step: f.ramp[i].step,
          jump: d,
          from: f.ramp[i - 1].pct,
          to: f.ramp[i].pct,
          severity: d > maxStep * 2 ? 'HIGH' : 'MEDIUM'
        });
      }
    }
  }
  
  return out;
}

/**
 * Comprehensive release risk assessment
 * @param {Object} metrics - Combined metrics object
 * @returns {Object} - Overall risk assessment
 */
export function assessReleaseRisk(metrics) {
  const errorBudget = evaluateErrorBudget(metrics.errorTimeseries || [], metrics.sloTarget);
  const perfBudget = evaluatePerfBudget(metrics.performance || {}, metrics.perfBudget);
  const flagAnomalies = detectFlagRampAnomalies(metrics.featureFlags || [], metrics.maxFlagStep);
  
  const riskFactors = [];
  let overallRisk = 'LOW';
  
  if (!errorBudget.pass) {
    riskFactors.push('Error budget exceeded');
    overallRisk = 'HIGH';
  }
  
  if (!perfBudget.pass) {
    riskFactors.push('Performance budget exceeded');
    overallRisk = perfBudget.score < 50 ? 'HIGH' : 'MEDIUM';
  }
  
  if (flagAnomalies.length > 0) {
    const highSeverity = flagAnomalies.filter(a => a.severity === 'HIGH').length;
    if (highSeverity > 0) {
      riskFactors.push(`${highSeverity} high-severity flag ramp anomalies`);
      overallRisk = 'HIGH';
    } else {
      riskFactors.push(`${flagAnomalies.length} flag ramp anomalies`);
      overallRisk = overallRisk === 'LOW' ? 'MEDIUM' : overallRisk;
    }
  }
  
  return {
    overallRisk,
    riskFactors,
    recommendations: generateRiskRecommendations(overallRisk, riskFactors),
    metrics: {
      errorBudget,
      perfBudget,
      flagAnomalies: {
        count: flagAnomalies.length,
        highSeverity: flagAnomalies.filter(a => a.severity === 'HIGH').length,
        details: flagAnomalies
      }
    }
  };
}

/**
 * Generate risk mitigation recommendations
 * @param {string} riskLevel - Risk level (LOW, MEDIUM, HIGH)
 * @param {Array} riskFactors - Array of risk factors
 * @returns {Array} - Array of recommendations
 */
function generateRiskRecommendations(riskLevel, riskFactors) {
  const recommendations = [];
  
  if (riskLevel === 'HIGH') {
    recommendations.push('🚨 IMMEDIATE ACTION REQUIRED: Consider rollback or emergency fix');
    recommendations.push('🔍 Investigate root cause of all risk factors');
    recommendations.push('📊 Increase monitoring frequency');
  } else if (riskLevel === 'MEDIUM') {
    recommendations.push('⚠️ Monitor closely and prepare mitigation plan');
    recommendations.push('📈 Review metrics trends over next 24 hours');
  } else {
    recommendations.push('✅ Continue normal operations');
    recommendations.push('📊 Maintain current monitoring levels');
  }
  
  if (riskFactors.includes('Error budget exceeded')) {
    recommendations.push('🐛 Investigate error patterns and implement fixes');
  }
  
  if (riskFactors.includes('Performance budget exceeded')) {
    recommendations.push('⚡ Optimize performance bottlenecks');
  }
  
  if (riskFactors.some(f => f.includes('flag ramp anomalies'))) {
    recommendations.push('🚩 Review feature flag ramp strategy');
  }
  
  return recommendations;
}
