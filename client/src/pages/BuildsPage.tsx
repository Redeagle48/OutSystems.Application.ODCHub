import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { useBuilds } from "../hooks/useBuilds";
import { useAssets } from "../hooks/useAssets";
import { DataTable, type Column } from "../components/DataTable";
import { StatusBadge } from "../components/StatusBadge";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorAlert } from "../components/ErrorAlert";
import styles from "../styles/pages.module.css";

export function BuildsPage() {
  const [selectedAsset, setSelectedAsset] = useState<string>("");
  const assets = useAssets();
  const { data, isLoading, error, refetch, isFetching } = useBuilds(
    selectedAsset || null,
  );

  const columns: Column<Record<string, unknown>>[] = [
    { key: "key", label: "Build ID" },
    {
      key: "status",
      label: "Status",
      render: (row) =>
        row.status ? <StatusBadge status={String(row.status)} /> : "-",
    },
    { key: "startedAt", label: "Started" },
    { key: "finishedAt", label: "Finished" },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.headerTitle}>Builds</h1>
          <p className={styles.headerSubtitle}>
            Build operations and logs
          </p>
        </div>
        {selectedAsset && (
          <div className={styles.toolbar}>
            <button
              className={`${styles.btn} ${styles.btnSecondary}`}
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw size={14} />
              Refresh
            </button>
          </div>
        )}
      </div>

      <div className={styles.toolbar}>
        <select
          className={styles.select}
          value={selectedAsset}
          onChange={(e) => setSelectedAsset(e.target.value)}
          style={{ minWidth: 300 }}
        >
          <option value="">Select an asset to view builds...</option>
          {(assets.data ?? []).map((a) => (
            <option key={String(a.assetKey)} value={String(a.assetKey)}>
              {String(a.name || a.assetKey)}
            </option>
          ))}
        </select>
        {assets.isLoading && (
          <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
            Loading assets...
          </span>
        )}
      </div>

      {!selectedAsset && (
        <p style={{ color: "var(--color-text-secondary)", fontSize: 14 }}>
          Select an asset above to view its build history.
        </p>
      )}

      {selectedAsset && isLoading && (
        <LoadingSpinner message="Loading builds..." />
      )}
      {selectedAsset && error && (
        <ErrorAlert message={error.message} onRetry={() => refetch()} />
      )}
      {selectedAsset && data && (
        <DataTable
          columns={columns}
          data={data as Record<string, unknown>[]}
          keyField="key"
          emptyMessage="No build operations found for this asset"
        />
      )}
    </div>
  );
}
