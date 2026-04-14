import { useQuery, useMutation } from "@tanstack/react-query";
import { apiClient } from "../api/client";

interface Analysis {
  analysisKey: string;
  processStatus: string;
  report: unknown;
  error: unknown;
  [k: string]: unknown;
}

export function useAnalysis(analysisKey: string | null) {
  return useQuery({
    queryKey: ["analysis", analysisKey],
    queryFn: () =>
      apiClient<Analysis>(`/dependencies/deployment-analyses/${analysisKey}`),
    enabled: !!analysisKey,
    refetchInterval: (query) => {
      const s = (query.state.data as Analysis | undefined)?.processStatus?.toLowerCase();
      return s === "completed" || s === "failed" ? false : 5000;
    },
  });
}

export function useCreateAnalysis() {
  return useMutation({
    mutationFn: (body: unknown) =>
      apiClient<Analysis>("/dependencies/deployment-analyses", {
        method: "POST",
        body: JSON.stringify(body),
      }),
  });
}
