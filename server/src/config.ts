import "dotenv/config";
import { writeFileSync } from "fs";
import { join } from "path";

export const config = {
  port: parseInt(process.env.PORT || "3001", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  odc: {
    portalDomain: process.env.ODC_PORTAL_DOMAIN || "",
    clientId: process.env.ODC_CLIENT_ID || "",
    clientSecret: process.env.ODC_CLIENT_SECRET || "",
  },
};

export function isConfigured(): boolean {
  return !!(config.odc.portalDomain && config.odc.clientId && config.odc.clientSecret);
}

export function updateOdcConfig(values: {
  portalDomain: string;
  clientId: string;
  clientSecret: string;
}): void {
  config.odc.portalDomain = values.portalDomain;
  config.odc.clientId = values.clientId;
  config.odc.clientSecret = values.clientSecret;

  // Persist to .env file so it survives restarts (dotenv reads from cwd)
  const envPath = join(process.cwd(), ".env");
  const content = [
    `ODC_PORTAL_DOMAIN=${values.portalDomain}`,
    `ODC_CLIENT_ID=${values.clientId}`,
    `ODC_CLIENT_SECRET=${values.clientSecret}`,
    `PORT=${config.port}`,
    "",
  ].join("\n");
  writeFileSync(envPath, content, "utf-8");
  console.log("[Config] Updated .env and in-memory config");
}
