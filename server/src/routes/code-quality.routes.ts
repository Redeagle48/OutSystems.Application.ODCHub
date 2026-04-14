import { Router } from "express";
import { odcFetch } from "../proxy/odc-client.js";

const router = Router();

// Trigger an ad-hoc code analysis
router.post("/analyses", async (req, res, next) => {
  try {
    const data = await odcFetch("/code-quality/v1/code-analyses", {
      method: "POST",
      body: req.body,
    });
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// Get code analysis status
router.get("/analyses/:analysisKey", async (req, res, next) => {
  try {
    const data = await odcFetch(
      `/code-quality/v1/code-analyses/${req.params.analysisKey}`,
    );
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// List findings
router.get("/findings", async (req, res, next) => {
  try {
    const data = await odcFetch("/code-quality/v1/findings", {
      query: req.query as Record<string, string>,
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// Get findings summary
router.get("/findings-summary", async (req, res, next) => {
  try {
    const data = await odcFetch("/code-quality/v1/findings-summary", {
      query: req.query as Record<string, string>,
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// Get findings trend
router.get("/findings-trend", async (req, res, next) => {
  try {
    const data = await odcFetch("/code-quality/v1/findings-trend", {
      query: req.query as Record<string, string>,
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// Get asset quality metrics overview
router.get("/metrics", async (req, res, next) => {
  try {
    const data = await odcFetch("/code-quality/v1/assets-quality-metrics", {
      query: req.query as Record<string, string>,
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// Get analysis summary for a specific asset revision
router.get(
  "/assets/:assetKey/revisions/:revision/summary",
  async (req, res, next) => {
    try {
      const { assetKey, revision } = req.params;
      const data = await odcFetch(
        `/code-quality/v1/assets/${assetKey}/revisions/${revision}/analysis-summary`,
      );
      res.json(data);
    } catch (err) {
      next(err);
    }
  },
);

// List patterns
router.get("/patterns", async (req, res, next) => {
  try {
    const data = await odcFetch("/code-quality/v1/patterns", {
      query: req.query as Record<string, string>,
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// Get analysis sync status
router.get("/status", async (_req, res, next) => {
  try {
    const data = await odcFetch("/code-quality/v1/analysis-status");
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
