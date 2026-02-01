import express from "express";
import { 
  evaluateErrorBudget, 
  evaluatePerfBudget, 
  detectFlagRampAnomalies,
  assessReleaseRisk 
} from "../modules/releaseRisk.js";

const router = express.Router();

// GET /release-risk - Default risk assessment with sample data
router.get("/", (_req, res) => {
  try {
    // Sample metrics for demonstration
    const sampleMetrics = {
      errorTimeseries: [
        { ts: Date.now() - 4 * 3600000, errors: 5, requests: 10000 },
        { ts: Date.now() - 3 * 3600000, errors: 3, requests: 10000 },
        { ts: Date.now() - 2 * 3600000, errors: 8, requests: 15000 },
        { ts: Date.now() - 1 * 3600000, errors: 2, requests: 10000 },
        { ts: Date.now(), errors: 1, requests: 10000 }
      ],
      sloTarget: 99.9,
      performance: { LCP_ms: 2200, CLS: 0.07, TBT_ms: 180 },
      perfBudget: { LCP_ms: 2500, CLS: 0.1, TBT_ms: 200 },
      featureFlags: [
        {
          name: "newCheckout",
          ramp: [
            { step: 1, pct: 5 },
            { step: 2, pct: 40 },
            { step: 3, pct: 60 },
            { step: 4, pct: 100 }
          ]
        }
      ],
      maxFlagStep: 25
    };

    const assessment = assessReleaseRisk(sampleMetrics);
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      assessment,
      sampleData: sampleMetrics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// POST /release-risk/error-budget - Evaluate error budget
router.post("/error-budget", (req, res) => {
  try {
    const { errorTimeseries, sloTarget } = req.body;
    
    if (!errorTimeseries || !Array.isArray(errorTimeseries)) {
      return res.status(400).json({
        success: false,
        error: "errorTimeseries array is required"
      });
    }

    const result = evaluateErrorBudget(errorTimeseries, sloTarget || 99.9);
    
    res.json({
      success: true,
      result,
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

// POST /release-risk/performance - Evaluate performance budget
router.post("/performance", (req, res) => {
  try {
    const { performance, budget } = req.body;
    
    if (!performance) {
      return res.status(400).json({
        success: false,
        error: "performance metrics are required"
      });
    }

    const result = evaluatePerfBudget(performance, budget);
    
    res.json({
      success: true,
      result,
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

// POST /release-risk/feature-flags - Detect flag ramp anomalies
router.post("/feature-flags", (req, res) => {
  try {
    const { flags, maxStep } = req.body;
    
    if (!flags || !Array.isArray(flags)) {
      return res.status(400).json({
        success: false,
        error: "flags array is required"
      });
    }

    const result = detectFlagRampAnomalies(flags, maxStep || 25);
    
    res.json({
      success: true,
      result,
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

// POST /release-risk/assess - Comprehensive risk assessment
router.post("/assess", (req, res) => {
  try {
    const metrics = req.body;
    
    if (!metrics) {
      return res.status(400).json({
        success: false,
        error: "metrics object is required"
      });
    }

    const assessment = assessReleaseRisk(metrics);
    
    res.json({
      success: true,
      assessment,
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

// GET /release-risk/error-budget - Get error budget evaluation with sample data
router.get("/error-budget", (_req, res) => {
  try {
    const sampleErrorTimeseries = [
      { ts: Date.now() - 4 * 3600000, errors: 5, requests: 10000 },
      { ts: Date.now() - 3 * 3600000, errors: 3, requests: 10000 },
      { ts: Date.now() - 2 * 3600000, errors: 8, requests: 15000 },
      { ts: Date.now() - 1 * 3600000, errors: 2, requests: 10000 },
      { ts: Date.now(), errors: 1, requests: 10000 }
    ];
    
    const result = evaluateErrorBudget(sampleErrorTimeseries, 99.9);
    
    res.json({
      success: true,
      result,
      sampleData: {
        errorTimeseries: sampleErrorTimeseries,
        sloTarget: 99.9
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

// GET /release-risk/performance - Get performance evaluation with sample data
router.get("/performance", (_req, res) => {
  try {
    const samplePerformance = { LCP_ms: 2200, CLS: 0.07, TBT_ms: 180 };
    const sampleBudget = { LCP_ms: 2500, CLS: 0.1, TBT_ms: 200 };
    
    const result = evaluatePerfBudget(samplePerformance, sampleBudget);
    
    res.json({
      success: true,
      result,
      sampleData: {
        performance: samplePerformance,
        budget: sampleBudget
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

// GET /release-risk/feature-flags - Get feature flag evaluation with sample data
router.get("/feature-flags", (_req, res) => {
  try {
    const sampleFlags = [
      {
        name: "newCheckout",
        ramp: [
          { step: 1, pct: 5 },
          { step: 2, pct: 40 },
          { step: 3, pct: 60 },
          { step: 4, pct: 100 }
        ]
      }
    ];
    
    const result = detectFlagRampAnomalies(sampleFlags, 25);
    
    res.json({
      success: true,
      result,
      sampleData: {
        flags: sampleFlags,
        maxStep: 25
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

export const releaseRiskRouter = router;
