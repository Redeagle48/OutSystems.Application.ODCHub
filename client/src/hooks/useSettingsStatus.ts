import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../api/client";

export interface SettingsStatus {
  portalDomain: string;
  clientId: string;
  hasSecret: boolean;
  configured: boolean;
  connected: boolean;
  tokenExpiresAt: number | null;
}

export function useSettingsStatus() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["settings"],
    queryFn: () => apiClient<SettingsStatus>("/settings"),
    staleTime: 10_000,
    select: (raw): SettingsStatus => ({
      ...raw,
      connected:
        raw.connected &&
        (raw.tokenExpiresAt === null || raw.tokenExpiresAt > Date.now()),
    }),
  });

  // Proactively refetch the moment the cached token expires, so the UI
  // reflects the disconnected state without waiting for the next user action.
  const expiresAt = query.data?.tokenExpiresAt ?? null;
  useEffect(() => {
    if (!expiresAt) return;
    const ms = expiresAt - Date.now();
    if (ms <= 0) {
      qc.invalidateQueries({ queryKey: ["settings"] });
      return;
    }
    const timer = setTimeout(() => {
      qc.invalidateQueries({ queryKey: ["settings"] });
    }, ms);
    return () => clearTimeout(timer);
  }, [expiresAt, qc]);

  return query;
}
