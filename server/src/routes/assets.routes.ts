import { Router } from "express";
import { odcFetch } from "../proxy/odc-client.js";

const router = Router();

// List assets
router.get("/", async (req, res, next) => {
  try {
    const data = await odcFetch("/asset-repository/v1/assets", {
      query: req.query as Record<string, string>,
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// Get asset details
router.get("/:assetKey", async (req, res, next) => {
  try {
    const data = await odcFetch(
      `/asset-repository/v1/assets/${req.params.assetKey}`,
    );
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// List asset revisions
router.get("/:assetKey/revisions", async (req, res, next) => {
  try {
    const data = await odcFetch(
      `/asset-repository/v1/assets/${req.params.assetKey}/revisions`,
      { query: req.query as Record<string, string> },
    );
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
