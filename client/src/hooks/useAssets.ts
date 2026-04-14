import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../api/client";

interface Asset {
  key: string;
  name: string;
  type: string;
  version: string;
  lastModified: string;
  [k: string]: unknown;
}

interface PaginatedResponse<T> {
  results: T[];
  page?: unknown;
}

export function useAssets(filters?: Record<string, string>) {
  const merged = { limit: "1000", ...filters };
  const params = "?" + new URLSearchParams(merged).toString();
  return useQuery({
    queryKey: ["assets", filters],
    queryFn: async () => {
      const data = await apiClient<PaginatedResponse<Asset>>(`/assets${params}`);
      return data.results ?? [];
    },
    staleTime: 60_000,
  });
}

export function useAsset(assetKey: string | null) {
  return useQuery({
    queryKey: ["asset", assetKey],
    queryFn: () => apiClient(`/assets/${assetKey}`),
    enabled: !!assetKey,
  });
}
