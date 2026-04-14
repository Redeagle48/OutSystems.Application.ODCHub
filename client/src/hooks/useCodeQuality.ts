import { useQuery, useMutation } from "@tanstack/react-query";
import { apiClient } from "../api/client";

interface PaginatedResponse<T> {
  results: T[];
  page?: unknown;
}

// GET /code-quality/v1/assets-quality-metrics
export interface QualityMetric {
  assetName: string | null;
  assetKey: string | null;
  assetRevision: number;
  score: {
    latestScore: number | null;
    differenceScore: number | null;
  } | null;
  severity: Record<
    string,
    { latestFindingsCount: number | null; findingsDifferenceCount: number | null }
  > | null;
  status: Record<
    string,
    { latestFindingsCount: number | null; findingsDifferenceCount: number | null }
  > | null;
}

// GET /code-quality/v1/findings
export interface Finding {
  id: string;
  patternId: string | null;
  discoveredOn: string | null;
  elementName: string | null;
  elementType: string | null;
  whereElementName: string | null;
  whereElementType: string | null;
  status: string | null;
  severity: string | null;
  assetKey: string | null;
  assetRevision: number | null;
  dismissReason: string | null;
  [k: string]: unknown;
}

// GET /code-quality/v1/findings-summary
export interface FindingsSummary {
  totalFindings: {
    latestFindingsCount: number;
    findingsDifferenceCount: number;
  } | null;
  results: Record<string, unknown> | null;
}

interface CodeAnalysisStatus {
  analysisKey: string;
  status: string;
  [k: string]: unknown;
}

export function useQualityMetrics() {
  return useQuery({
    queryKey: ["quality-metrics"],
    queryFn: async () => {
      const data = await apiClient<PaginatedResponse<QualityMetric>>(
        "/code-quality/metrics?Limit=200",
      );
      return data.results ?? [];
    },
    staleTime: 60_000,
  });
}

export function useFindings(filters?: Record<string, string>) {
  const merged = { Limit: "50", ...filters };
  const params = "?" + new URLSearchParams(merged).toString();
  return useQuery({
    queryKey: ["findings", filters],
    queryFn: async () => {
      const data = await apiClient<PaginatedResponse<Finding>>(
        `/code-quality/findings${params}`,
      );
      return data.results ?? [];
    },
    staleTime: 60_000,
  });
}

export function useFindingsSummary() {
  return useQuery({
    queryKey: ["findings-summary"],
    queryFn: () =>
      apiClient<FindingsSummary>(
        "/code-quality/findings-summary?GroupBy=Category&GroupBy=Status&GroupBy=Severity",
      ),
    staleTime: 60_000,
  });
}

export function useCodeAnalysisStatus(analysisKey: string | null) {
  return useQuery({
    queryKey: ["code-analysis", analysisKey],
    queryFn: () =>
      apiClient<CodeAnalysisStatus>(`/code-quality/analyses/${analysisKey}`),
    enabled: !!analysisKey,
    refetchInterval: (query) => {
      const s = (query.state.data as CodeAnalysisStatus | undefined)?.status?.toLowerCase();
      return s === "completed" || s === "failed" ? false : 5000;
    },
  });
}

export function useCreateCodeAnalysis() {
  return useMutation({
    mutationFn: (body: unknown) =>
      apiClient<CodeAnalysisStatus>("/code-quality/analyses", {
        method: "POST",
        body: JSON.stringify(body),
      }),
  });
}
