import { Router } from "express";
import { odcFetch } from "../proxy/odc-client.js";

const router = Router();

// Create a deployment analysis
router.post("/deployment-analyses", async (req, res, next) => {
  try {
    const data = await odcFetch(
      "/dependency-management/v1/deployment-analyses",
      { method: "POST", body: req.body },
    );
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// Get deployment analysis results
router.get("/deployment-analyses/:analysisKey", async (req, res, next) => {
  try {
    const data = await odcFetch(
      `/dependency-management/v1/deployment-analyses/${req.params.analysisKey}`,
    );
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// Create a deletion analysis
router.post("/deletion-analyses", async (req, res, next) => {
  try {
    const data = await odcFetch(
      "/dependency-management/v1/deletion-analyses",
      { method: "POST", body: req.body },
    );
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// Get deletion analysis results
router.get("/deletion-analyses/:analysisKey", async (req, res, next) => {
  try {
    const data = await odcFetch(
      `/dependency-management/v1/deletion-analyses/${req.params.analysisKey}`,
    );
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// Get asset consumers
router.get("/assets/:assetKey/consumers", async (req, res, next) => {
  try {
    const data = await odcFetch(
      `/dependency-management/v1/assets/${req.params.assetKey}/consumers`,
    );
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// Get asset producers (dependencies)
router.get(
  "/assets/:assetKey/revisions/:revision/producers",
  async (req, res, next) => {
    try {
      const { assetKey, revision } = req.params;
      const data = await odcFetch(
        `/dependency-management/v1/assets/${assetKey}/revisions/${revision}/producers`,
      );
      res.json(data);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
