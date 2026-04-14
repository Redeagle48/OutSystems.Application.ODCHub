import { Router } from "express";
import { config, isConfigured, updateOdcConfig } from "../config.js";
import { tokenManager } from "../auth/token-manager.js";

const router = Router();

router.get("/", (_req, res) => {
  const status = tokenManager.getStatus();
  res.json({
    portalDomain: config.odc.portalDomain,
    clientId: config.odc.clientId,
    // Never send the full secret — just indicate if one is set
    hasSecret: !!config.odc.clientSecret,
    configured: isConfigured(),
    connected: status.connected,
    tokenExpiresAt: status.expiresAt,
  });
});

router.put("/", (req, res) => {
  const { portalDomain, clientId, clientSecret } = req.body;

  if (!portalDomain || !clientId) {
    res.status(400).json({ error: "Portal domain and client ID are required" });
    return;
  }

  // Keep existing secret if not provided
  const secret = clientSecret || config.odc.clientSecret;
  if (!secret) {
    res.status(400).json({ error: "Client secret is required" });
    return;
  }

  updateOdcConfig({ portalDomain, clientId, clientSecret: secret });
  tokenManager.reset();

  res.json({ success: true, message: "Configuration saved" });
});

router.post("/test", async (_req, res, next) => {
  if (!isConfigured()) {
    res.status(400).json({ error: "ODC credentials not configured. Save settings first." });
    return;
  }
  try {
    await tokenManager.getToken();
    res.json({ success: true, message: "Connected to ODC portal" });
  } catch (err) {
    next(err);
  }
});

export default router;
