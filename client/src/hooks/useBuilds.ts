import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../api/client";

interface BuildOperation {
  key: string;
  assetName: string;
  status: string;
  startedAt: string;
  duration: string;
  [k: string]: unknown;
}

interface PaginatedResponse<T> {
  results: T[];
  page?: unknown;
}

export function useBuilds(assetKey: string | null) {
  return useQuery({
    queryKey: ["builds", assetKey],
    queryFn: async () => {
      const data = await apiClient<PaginatedResponse<BuildOperation>>(
        `/builds?AssetKey=${assetKey}`,
      );
      return data.results ?? [];
    },
    enabled: !!assetKey,
    staleTime: 30_000,
  });
}

export function useBuildLogs(buildKey: string | null) {
  return useQuery({
    queryKey: ["build-logs", buildKey],
    queryFn: () => apiClient<unknown>(`/builds/${buildKey}/logs`),
    enabled: !!buildKey,
  });
}

export function useTriggerBuild() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: unknown) =>
      apiClient("/builds", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["builds"] }),
  });
}
