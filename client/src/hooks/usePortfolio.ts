import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../api/client";

interface Environment {
  key: string;
  name: string;
  [k: string]: unknown;
}

interface DeployedAsset {
  key: string;
  name: string;
  type: string;
  [k: string]: unknown;
}

interface PaginatedResponse<T> {
  results: T[];
  page?: unknown;
}

export function useEnvironments() {
  return useQuery({
    queryKey: ["environments"],
    queryFn: async () => {
      const data = await apiClient<PaginatedResponse<Environment>>("/portfolio/environments");
      return data.results ?? [];
    },
    staleTime: 5 * 60_000,
  });
}

export function useDeployedAssets() {
  return useQuery({
    queryKey: ["deployed-assets"],
    queryFn: async () => {
      const data = await apiClient<PaginatedResponse<DeployedAsset>>("/portfolio/deployed-assets");
      return data.results ?? [];
    },
    staleTime: 60_000,
  });
}
