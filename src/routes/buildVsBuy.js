import express from "express";
import { compare, renderMarkdown, generateReport } from "../modules/buildVsBuy.js";

const router = express.Router();

// GET /build-vs-buy - Default comparison with sample data
router.get("/", (_req, res) => {
  try {
    // Sample comparison for demonstration
    const sampleInput = {
      build: { cost: 120000, time_weeks: 8, risk: 0.3 },
      buy: { cost: 80000, time_weeks: 2, risk: 0.2 },
      weights: { cost: 0.5, time: 0.3, risk: 0.2 }
    };

    const comparison = compare(sampleInput);
    const markdown = renderMarkdown(sampleInput, comparison);
    const report = generateReport(sampleInput, comparison);
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      comparison,
      markdown,
      report,
      sampleData: sampleInput
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// POST /build-vs-buy/compare - Compare build vs buy options
router.post("/compare", (req, res) => {
  try {
    const { build, buy, weights } = req.body;
    
    if (!build || !buy) {
      return res.status(400).json({
        success: false,
        error: "Both build and buy options are required"
      });
    }

    // Validate required fields
    const requiredFields = ['cost', 'time_weeks', 'risk'];
    for (const field of requiredFields) {
      if (typeof build[field] === 'undefined' || typeof buy[field] === 'undefined') {
        return res.status(400).json({
          success: false,
          error: `Missing required field: ${field}`
        });
      }
    }

    const input = { build, buy, weights };
    const comparison = compare(input);
    const markdown = renderMarkdown(input, comparison);
    const report = generateReport(input, comparison);
    
    res.json({
      success: true,
      comparison,
      markdown,
      report,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// POST /build-vs-buy/markdown - Generate markdown report only
router.post("/markdown", (req, res) => {
  try {
    const { build, buy, weights } = req.body;
    
    if (!build || !buy) {
      return res.status(400).json({
        success: false,
        error: "Both build and buy options are required"
      });
    }

    const input = { build, buy, weights };
    const comparison = compare(input);
    const markdown = renderMarkdown(input, comparison);
    
    res.json({
      success: true,
      markdown,
      comparison: {
        winner: comparison.winner,
        confidence: comparison.confidence,
        delta: comparison.delta
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// POST /build-vs-buy/report - Generate JSON report only
router.post("/report", (req, res) => {
  try {
    const { build, buy, weights } = req.body;
    
    if (!build || !buy) {
      return res.status(400).json({
        success: false,
        error: "Both build and buy options are required"
      });
    }

    const input = { build, buy, weights };
    const comparison = compare(input);
    const report = generateReport(input, comparison);
    
    res.json({
      success: true,
      report,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /build-vs-buy/scenarios - Get predefined scenario templates
router.get("/scenarios", (_req, res) => {
  try {
    const scenarios = {
      standard: {
        name: "Standard Comparison",
        description: "Balanced weighting: Cost 50%, Time 30%, Risk 20%",
        weights: { cost: 0.5, time: 0.3, risk: 0.2 }
      },
      timeCritical: {
        name: "Time-Critical Project",
        description: "Emphasizes time over cost: Cost 30%, Time 60%, Risk 10%",
        weights: { cost: 0.3, time: 0.6, risk: 0.1 }
      },
      costSensitive: {
        name: "Cost-Sensitive Project",
        description: "Emphasizes cost over time: Cost 70%, Time 20%, Risk 10%",
        weights: { cost: 0.7, time: 0.2, risk: 0.1 }
      },
      riskAverse: {
        name: "Risk-Averse Project",
        description: "Emphasizes risk mitigation: Cost 20%, Time 20%, Risk 60%",
        weights: { cost: 0.2, time: 0.2, risk: 0.6 }
      }
    };
    
    res.json({
      success: true,
      scenarios,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export const buildVsBuyRouter = router;
