import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../api/client";

interface Deployment {
  key: string;
  sourceEnvironment: string;
  targetEnvironment: string;
  status: string;
  createdAt: string;
  [k: string]: unknown;
}

interface PaginatedResponse<T> {
  results: T[];
  page?: unknown;
}

export function useDeployments() {
  return useQuery({
    queryKey: ["deployments"],
    queryFn: async () => {
      const data = await apiClient<PaginatedResponse<Deployment>>("/deployments");
      return data.results ?? [];
    },
    staleTime: 30_000,
  });
}

export function useDeployment(deployKey: string | null) {
  return useQuery({
    queryKey: ["deployment", deployKey],
    queryFn: () => apiClient<Deployment>(`/deployments/${deployKey}`),
    enabled: !!deployKey,
  });
}

export function useCreateDeployment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: unknown) =>
      apiClient("/deployments", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["deployments"] }),
  });
}
