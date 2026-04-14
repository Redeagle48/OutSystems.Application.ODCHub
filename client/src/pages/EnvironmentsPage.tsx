import { Globe, Server } from "lucide-react";
import { useEnvironments, useDeployedAssets } from "../hooks/usePortfolio";
import { DataTable, type Column } from "../components/DataTable";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorAlert } from "../components/ErrorAlert";
import styles from "../styles/pages.module.css";

export function EnvironmentsPage() {
  const envs = useEnvironments();
  const assets = useDeployedAssets();

  if (envs.isLoading) return <LoadingSpinner message="Loading environments..." />;
  if (envs.error)
    return <ErrorAlert message={envs.error.message} onRetry={() => envs.refetch()} />;

  const environments = envs.data ?? [];

  const assetColumns: Column<Record<string, unknown>>[] = [
    {
      key: "name",
      label: "Name",
      render: (row) => {
        const deployments = row.deployments as Array<Record<string, unknown>> | undefined;
        return deployments?.[0]?.name ? String(deployments[0].name) : String(row.key);
      },
    },
    { key: "type", label: "Type" },
    {
      key: "environments",
      label: "Deployed To",
      sortable: false,
      render: (row) => {
        const deployments = row.deployments as Array<Record<string, unknown>> | undefined;
        if (!deployments?.length) return "-";
        return deployments
          .map((d) => {
            const env = environments.find((e) => e.key === d.environmentKey);
            return env?.name ?? "Unknown";
          })
          .join(", ");
      },
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.headerTitle}>Environments</h1>
          <p className={styles.headerSubtitle}>
            ODC environment stages
          </p>
        </div>
      </div>

      <div className={styles.cardGrid}>
        {environments.length === 0 && (
          <p style={{ color: "var(--color-text-secondary)" }}>
            No environments found. Check your ODC connection settings.
          </p>
        )}
        {environments.map((env) => (
          <div key={env.key} className={styles.card}>
            <div
              className={styles.cardTitle}
              style={{ display: "flex", alignItems: "center", gap: 8 }}
            >
              <Globe size={18} />
              {env.name || env.key}
            </div>
            <div className={styles.cardMeta}>
              <Server size={14} />
              Key: {env.key}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 8 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>
          Deployed Assets
        </h2>
        {assets.isLoading && <LoadingSpinner message="Loading deployed assets..." />}
        {assets.error && (
          <ErrorAlert message={assets.error.message} onRetry={() => assets.refetch()} />
        )}
        {assets.data && (
          <DataTable
            columns={assetColumns}
            data={assets.data as Record<string, unknown>[]}
            keyField="key"
            emptyMessage="No deployed assets found"
          />
        )}
      </div>
    </div>
  );
}
