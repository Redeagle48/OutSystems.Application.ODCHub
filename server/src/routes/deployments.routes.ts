import { Router } from "express";
import { odcFetch } from "../proxy/odc-client.js";

const router = Router();

// List deployment operations
router.get("/", async (req, res, next) => {
  try {
    const data = await odcFetch("/deployments/v1/deployment-operations", {
      query: req.query as Record<string, string>,
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// Get deployment details
router.get("/:operationKey", async (req, res, next) => {
  try {
    const data = await odcFetch(
      `/deployments/v1/deployment-operations/${req.params.operationKey}`,
    );
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// Get deployment log messages
router.get("/:operationKey/messages", async (req, res, next) => {
  try {
    const data = await odcFetch(
      `/deployments/v1/deployment-operations/${req.params.operationKey}/messages`,
    );
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// Create a deployment
router.post("/", async (req, res, next) => {
  try {
    const data = await odcFetch("/deployments/v1/deployment-operations", {
      method: "POST",
      body: req.body,
    });
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// --- Publish operations ---

// List publish operations
router.get("/publish", async (req, res, next) => {
  try {
    const data = await odcFetch("/deployments/v1/publish-operations", {
      query: req.query as Record<string, string>,
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// Get publish operation details
router.get("/publish/:operationKey", async (req, res, next) => {
  try {
    const data = await odcFetch(
      `/deployments/v1/publish-operations/${req.params.operationKey}`,
    );
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// Create a publish operation
router.post("/publish", async (req, res, next) => {
  try {
    const data = await odcFetch("/deployments/v1/publish-operations", {
      method: "POST",
      body: req.body,
    });
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
