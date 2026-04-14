import { config } from "../config.js";

interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

interface OIDCConfig {
  token_endpoint: string;
  [key: string]: unknown;
}

const REFRESH_BUFFER_MS = 5 * 60 * 1000; // Refresh 5 min before expiry

class TokenManager {
  private tokenEndpoint: string | null = null;
  private accessToken: string | null = null;
  private expiresAt = 0;
  private refreshPromise: Promise<string> | null = null;

  async getToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.expiresAt - REFRESH_BUFFER_MS) {
      return this.accessToken;
    }
    if (!this.refreshPromise) {
      this.refreshPromise = this.refresh().finally(() => {
        this.refreshPromise = null;
      });
    }
    return this.refreshPromise;
  }

  getStatus(): { connected: boolean; expiresAt: number | null } {
    return {
      connected: !!this.accessToken && Date.now() < this.expiresAt,
      expiresAt: this.expiresAt || null,
    };
  }

  invalidate(): void {
    this.accessToken = null;
    this.expiresAt = 0;
  }

  /** Full reset when credentials change — clears cached token endpoint too */
  reset(): void {
    this.tokenEndpoint = null;
    this.accessToken = null;
    this.expiresAt = 0;
    this.refreshPromise = null;
  }

  private async discover(): Promise<string> {
    const url = `https://${config.odc.portalDomain}/identity/.well-known/openid-configuration`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(
        `OIDC discovery failed (${res.status}): Check ODC_PORTAL_DOMAIN "${config.odc.portalDomain}"`,
      );
    }
    const data = (await res.json()) as OIDCConfig;
    if (!data.token_endpoint) {
      throw new Error("OIDC discovery response missing token_endpoint");
    }
    return data.token_endpoint;
  }

  private async refresh(): Promise<string> {
    if (!this.tokenEndpoint) {
      this.tokenEndpoint = await this.discover();
    }

    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: config.odc.clientId,
      client_secret: config.odc.clientSecret,
    });

    const res = await fetch(this.tokenEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      if (res.status === 401 || res.status === 400) {
        throw new Error(
          `Token request failed (${res.status}): Check ODC_CLIENT_ID and ODC_CLIENT_SECRET. ${text}`,
        );
      }
      throw new Error(`Token request failed (${res.status}): ${text}`);
    }

    const data = (await res.json()) as TokenResponse;
    this.accessToken = data.access_token;
    this.expiresAt = Date.now() + data.expires_in * 1000;

    console.log(
      `[TokenManager] Token acquired, expires in ${Math.round(data.expires_in / 60)} min`,
    );

    return this.accessToken;
  }
}

export const tokenManager = new TokenManager();
