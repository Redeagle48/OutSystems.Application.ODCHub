import { Router } from "express";
import { odcFetch } from "../proxy/odc-client.js";

const router = Router();

// List environments (stages)
router.get("/environments", async (req, res, next) => {
  try {
    const data = await odcFetch("/portfolios/v1/environments", {
      query: req.query as Record<string, string>,
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// List deployed assets with deployment status per environment
router.get("/deployed-assets", async (req, res, next) => {
  try {
    const data = await odcFetch("/portfolios/v1/deployed-assets", {
      query: req.query as Record<string, string>,
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
