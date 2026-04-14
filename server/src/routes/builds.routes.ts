import { Router } from "express";
import { odcFetch } from "../proxy/odc-client.js";

const router = Router();

// List build operations
router.get("/", async (req, res, next) => {
  try {
    const data = await odcFetch("/builds/v1/build-operations", {
      query: req.query as Record<string, string>,
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// Get build details
router.get("/:buildKey", async (req, res, next) => {
  try {
    const data = await odcFetch(
      `/builds/v1/build-operations/${req.params.buildKey}`,
    );
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// Get build logs
router.get("/:buildKey/logs", async (req, res, next) => {
  try {
    const data = await odcFetch(
      `/builds/v1/build-operations/${req.params.buildKey}/log-messages`,
    );
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// Trigger a build
router.post("/", async (req, res, next) => {
  try {
    const data = await odcFetch("/builds/v1/build-operations", {
      method: "POST",
      body: req.body,
    });
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
