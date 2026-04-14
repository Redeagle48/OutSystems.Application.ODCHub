import { Router } from "express";
import { odcFetch } from "../proxy/odc-client.js";

const router = Router();

// Get application configurations (deployed revision)
router.get(
  "/environments/:envKey/applications/:appKey",
  async (req, res, next) => {
    try {
      const { envKey, appKey } = req.params;
      const data = await odcFetch(
        `/asset-configurations/v1/environments/${envKey}/applications/${appKey}/revisions/deployed/configurations`,
      );
      res.json(data);
    } catch (err) {
      next(err);
    }
  },
);

// Update application configurations
router.patch(
  "/environments/:envKey/applications/:appKey",
  async (req, res, next) => {
    try {
      const { envKey, appKey } = req.params;
      const data = await odcFetch(
        `/asset-configurations/v1/environments/${envKey}/applications/${appKey}/configurations`,
        { method: "PATCH", body: req.body },
      );
      res.json(data);
    } catch (err) {
      next(err);
    }
  },
);

// Get default system configurations for an environment
router.get(
  "/environments/:envKey/system",
  async (req, res, next) => {
    try {
      const data = await odcFetch(
        `/asset-configurations/v1/environments/${req.params.envKey}/default-system-configurations`,
      );
      res.json(data);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
