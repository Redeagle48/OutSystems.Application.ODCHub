import { Router } from "express";
import { odcFetch } from "../proxy/odc-client.js";

const router = Router();

// List users
router.get("/", async (req, res, next) => {
  try {
    const data = await odcFetch("/identity/v1/users", {
      query: req.query as Record<string, string>,
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// Create user
router.post("/", async (req, res, next) => {
  try {
    const data = await odcFetch("/identity/v1/users", {
      method: "POST",
      body: req.body,
    });
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// Get current user info
router.get("/me", async (_req, res, next) => {
  try {
    const data = await odcFetch("/identity/v1/subjects/me");
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// List application roles
router.get("/roles", async (req, res, next) => {
  try {
    const data = await odcFetch("/identity/v1/application-roles", {
      query: req.query as Record<string, string>,
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// List organization roles
router.get("/organization-roles", async (req, res, next) => {
  try {
    const data = await odcFetch("/identity/v1/organization-roles", {
      query: req.query as Record<string, string>,
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// Get user's application roles
router.get("/:userKey/application-roles", async (req, res, next) => {
  try {
    const data = await odcFetch(
      `/identity/v1/users/${req.params.userKey}/application-roles`,
    );
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// Assign application role to user
router.post("/:userKey/application-roles/:roleKey", async (req, res, next) => {
  try {
    const data = await odcFetch(
      `/identity/v1/users/${req.params.userKey}/application-roles/${req.params.roleKey}`,
      { method: "POST", body: req.body },
    );
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// Remove application role from user
router.delete("/:userKey/application-roles/:roleKey", async (req, res, next) => {
  try {
    await odcFetch(
      `/identity/v1/users/${req.params.userKey}/application-roles/${req.params.roleKey}`,
      { method: "DELETE" },
    );
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
