import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../api/client";

export interface AssetDetail {
  assetKey: string;
  name: string;
  description: string | null;
  assetType: string | null;
  revision: number;
  tag: string | null;
  isExternal: boolean;
  createdBy: string | null;
  createdAt: string;
  revisionDateTime: string;
  commitMessage: string | null;
  taggedBy: string | null;
  taggedAt: string | null;
  clonedFromTemplateKey: string | null;
  [k: string]: unknown;
}

export interface AssetRevision {
  assetKey: string;
  revision: number;
  name: string;
  tag: string | null;
  createdBy: string | null;
  createdAt: string;
  revisionDateTime: string;
  commitMessage: string | null;
  [k: string]: unknown;
}

export interface Build {
  buildKey: string;
  assetKey: string;
  assetRevision: number;
  buildType: string;
  status: string;
  startedDateTime: string | null;
  finishedDateTime: string | null;
  builtBy: string | null;
  [k: string]: unknown;
}

export interface DeploymentOp {
  key: string;
  assetKey: string;
  assetName: string | null;
  status: string;
  operation: string;
  startedDateTime: string;
  finishedDateTime: string | null;
  deployedBy: string | null;
  revisions: number[] | null;
  buildKey: string | null;
  [k: string]: unknown;
}

export interface AssetDependency {
  key: string;
  name: string | null;
  type: string | null;
  revision: number;
  isDirectProducer?: boolean;
  [k: string]: unknown;
}

interface PaginatedResponse<T> {
  results: T[];
  page?: unknown;
}

export function useAssetDetail(assetKey: string | null) {
  return useQuery({
    queryKey: ["asset-detail", assetKey],
    queryFn: () => apiClient<AssetDetail>(`/assets/${assetKey}`),
    enabled: !!assetKey,
  });
}

export function useAssetRevisions(assetKey: string | null) {
  return useQuery({
    queryKey: ["asset-revisions", assetKey],
    queryFn: async () => {
      const data = await apiClient<PaginatedResponse<AssetRevision>>(
        `/assets/${assetKey}/revisions?limit=100`,
      );
      return data.results ?? [];
    },
    enabled: !!assetKey,
    staleTime: 60_000,
  });
}

export function useAssetBuilds(
  assetKey: string | null,
  assetRevision: number | null,
) {
  return useQuery({
    queryKey: ["asset-builds", assetKey, assetRevision],
    queryFn: async () => {
      const data = await apiClient<{ builds: Build[] }>(
        `/builds?assetKey=${assetKey}&assetRevision=${assetRevision}`,
      );
      return data.builds ?? [];
    },
    enabled: !!assetKey && assetRevision != null,
    staleTime: 30_000,
  });
}

export function useAssetDeployments(assetKey: string | null) {
  return useQuery({
    queryKey: ["asset-deployments", assetKey],
    queryFn: async () => {
      const data = await apiClient<PaginatedResponse<DeploymentOp>>(
        `/deployments?assetKey=${assetKey}&limit=50`,
      );
      return data.results ?? [];
    },
    enabled: !!assetKey,
    staleTime: 30_000,
  });
}

export function useAssetConsumers(assetKey: string | null) {
  return useQuery({
    queryKey: ["asset-consumers", assetKey],
    queryFn: async () => {
      const data = await apiClient<PaginatedResponse<AssetDependency>>(
        `/dependencies/assets/${assetKey}/consumers`,
      );
      return data.results ?? [];
    },
    enabled: !!assetKey,
    staleTime: 60_000,
  });
}

export function useAssetProducers(
  assetKey: string | null,
  revision: number | null,
) {
  return useQuery({
    queryKey: ["asset-producers", assetKey, revision],
    queryFn: async () => {
      const data = await apiClient<PaginatedResponse<AssetDependency>>(
        `/dependencies/assets/${assetKey}/revisions/${revision}/producers`,
      );
      return data.results ?? [];
    },
    enabled: !!assetKey && revision != null,
    staleTime: 60_000,
  });
}

export function useAssetFindings(assetKey: string | null) {
  return useQuery({
    queryKey: ["asset-findings", assetKey],
    queryFn: async () => {
      const data = await apiClient<PaginatedResponse<Record<string, unknown>>>(
        `/code-quality/findings?AssetKeys=${assetKey}&Limit=50`,
      );
      return data.results ?? [];
    },
    enabled: !!assetKey,
    staleTime: 60_000,
  });
}
