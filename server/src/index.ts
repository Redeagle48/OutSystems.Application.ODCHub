import { createApp } from "./app.js";
import { config, isConfigured } from "./config.js";

const app = createApp();

app.listen(config.port, () => {
  console.log(`[Server] Running on http://localhost:${config.port}`);
  if (isConfigured()) {
    console.log(`[Server] ODC Portal: ${config.odc.portalDomain}`);
  } else {
    console.log("[Server] ODC not configured — open the Settings page to set credentials");
  }
});
