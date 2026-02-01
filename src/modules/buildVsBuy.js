/**
 * Build-vs-Buy Advisor
 * Scores and compares build vs buy options with weighted analysis
 */

/**
 * Score an option based on weighted criteria
 * @param {Object} option - Option object with cost, time_weeks, risk
 * @param {Object} weights - Weighting factors {cost, time, risk}
 * @returns {number} - Normalized score (lower is better)
 */
export function score(option, w) {
  // Normalize: lower is better for cost/time/risk
  // Assume input already comparable; keep simple
  return option.cost * w.cost + option.time_weeks * w.time + option.risk * 100 * w.risk;
}

/**
 * Compare build vs buy options
 * @param {Object} input - Input object with build, buy, and weights
 * @returns {Object} - Comparison results with scores and winner
 */
export function compare(input) {
  const w = input.weights || { cost: 0.5, time: 0.3, risk: 0.2 };
  const sBuild = score(input.build, w);
  const sBuy = score(input.buy, w);
  const winner = sBuild < sBuy ? "BUILD" : "BUY";
  const delta = Math.abs(sBuild - sBuy);
  
  return { 
    sBuild: +sBuild.toFixed(2), 
    sBuy: +sBuy.toFixed(2), 
    winner, 
    delta: +delta.toFixed(2),
    confidence: calculateConfidence(delta, sBuild, sBuy),
    breakdown: {
      build: {
        cost: input.build.cost * w.cost,
        time: input.build.time_weeks * w.time,
        risk: input.build.risk * 100 * w.risk
      },
      buy: {
        cost: input.buy.cost * w.cost,
        time: input.buy.time_weeks * w.time,
        risk: input.buy.risk * 100 * w.risk
      }
    }
  };
}

/**
 * Calculate confidence level in the recommendation
 * @param {number} delta - Score difference
 * @param {number} sBuild - Build score
 * @param {number} sBuy - Buy score
 * @returns {string} - Confidence level
 */
function calculateConfidence(delta, sBuild, sBuy) {
  const total = Math.max(sBuild, sBuy);
  const percentage = (delta / total) * 100;
  
  if (percentage > 30) return 'HIGH';
  if (percentage > 15) return 'MEDIUM';
  return 'LOW';
}

/**
 * Render comparison as Markdown
 * @param {Object} input - Input object with build, buy, and weights
 * @param {Object} cmp - Comparison results
 * @returns {string} - Formatted Markdown
 */
export function renderMarkdown(input, cmp) {
  const weights = input.weights || { cost: 0.5, time: 0.3, risk: 0.2 };
  
  return `## Build vs Buy Analysis

**Weights**: Cost=${(weights.cost * 100).toFixed(0)}%, Time=${(weights.time * 100).toFixed(0)}%, Risk=${(weights.risk * 100).toFixed(0)}%

| Option | Cost | Time (weeks) | Risk | Score |
|--------|------|--------------|------|-------|
| **Build** | $${input.build.cost.toLocaleString()} | ${input.build.time_weeks} | ${(input.build.risk * 100).toFixed(1)}% | **${cmp.sBuild}** |
| **Buy** | $${input.buy.cost.toLocaleString()} | ${input.buy.time_weeks} | ${(input.buy.risk * 100).toFixed(1)}% | **${cmp.sBuy}** |

**Recommendation**: **${cmp.winner}** (Δ=${cmp.delta})

**Confidence**: ${cmp.confidence}

### Detailed Breakdown

#### Build Option
- **Cost Impact**: $${cmp.breakdown.build.cost.toFixed(0)} (${(weights.cost * 100).toFixed(0)}% weight)
- **Time Impact**: ${cmp.breakdown.build.time.toFixed(1)} (${(weights.time * 100).toFixed(0)}% weight)
- **Risk Impact**: ${cmp.breakdown.build.risk.toFixed(1)} (${(weights.risk * 100).toFixed(0)}% weight)

#### Buy Option
- **Cost Impact**: $${cmp.breakdown.buy.cost.toFixed(0)} (${(weights.cost * 100).toFixed(0)}% weight)
- **Time Impact**: ${cmp.breakdown.buy.time.toFixed(1)} (${(weights.time * 100).toFixed(0)}% weight)
- **Risk Impact**: ${cmp.breakdown.buy.risk.toFixed(1)} (${(weights.risk * 100).toFixed(0)}% weight)

### Key Considerations

${generateConsiderations(input, cmp)}
`;
}

/**
 * Generate contextual considerations based on the comparison
 * @param {Object} input - Input object
 * @param {Object} cmp - Comparison results
 * @returns {string} - Considerations text
 */
function generateConsiderations(input, cmp) {
  const considerations = [];
  
  if (cmp.winner === 'BUILD') {
    considerations.push('- **Customization**: Building allows full control over features and integration');
    considerations.push('- **Long-term ownership**: No vendor lock-in or recurring licensing costs');
    considerations.push('- **Team growth**: Opportunity to build internal expertise');
  } else {
    considerations.push('- **Speed to market**: Faster implementation with proven solutions');
    considerations.push('- **Reduced risk**: Leverage vendor expertise and support');
    considerations.push('- **Focus**: Keep team focused on core business logic');
  }
  
  if (Math.abs(input.build.cost - input.buy.cost) / Math.max(input.build.cost, input.buy.cost) > 0.3) {
    considerations.push('- **Cost sensitivity**: Significant cost difference may impact budget allocation');
  }
  
  if (Math.abs(input.build.time_weeks - input.buy.time_weeks) > 4) {
    considerations.push('- **Timeline criticality**: Time difference may affect project deadlines');
  }
  
  if (Math.abs(input.build.risk - input.buy.risk) > 0.2) {
    considerations.push('- **Risk tolerance**: Risk difference may require additional mitigation strategies');
  }
  
  return considerations.join('\n');
}

/**
 * Generate JSON report for API consumption
 * @param {Object} input - Input object
 * @param {Object} cmp - Comparison results
 * @returns {Object} - Structured JSON report
 */
export function generateReport(input, cmp) {
  return {
    recommendation: cmp.winner,
    confidence: cmp.confidence,
    scores: {
      build: cmp.sBuild,
      buy: cmp.sBuy,
      difference: cmp.delta
    },
    weights: input.weights || { cost: 0.5, time: 0.3, risk: 0.2 },
    options: {
      build: {
        ...input.build,
        breakdown: cmp.breakdown.build
      },
      buy: {
        ...input.buy,
        breakdown: cmp.breakdown.buy
      }
    },
    considerations: generateConsiderations(input, cmp).split('\n').filter(line => line.trim()),
    timestamp: new Date().toISOString()
  };
}
