import { RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { useDeployments } from "../hooks/useDeployments";
import { DataTable, type Column } from "../components/DataTable";
import { StatusBadge } from "../components/StatusBadge";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorAlert } from "../components/ErrorAlert";
import styles from "../styles/pages.module.css";

export function DeploymentsPage() {
  const { data, isLoading, error, refetch, isFetching } = useDeployments();

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: "assetName",
      label: "Asset",
      render: (row) =>
        row.assetKey ? (
          <Link
            to={`/assets/${row.assetKey}`}
            style={{ color: "var(--color-primary)", textDecoration: "none", fontWeight: 500 }}
          >
            {String(row.assetName || row.assetKey)}
          </Link>
        ) : (
          String(row.assetName ?? "-")
        ),
    },
    { key: "operation", label: "Operation" },
    {
      key: "status",
      label: "Status",
      render: (row) =>
        row.status ? <StatusBadge status={String(row.status)} /> : "-",
    },
    {
      key: "revisions",
      label: "Revisions",
      render: (row) =>
        Array.isArray(row.revisions) ? row.revisions.join(", ") : "-",
    },
    {
      key: "startedDateTime",
      label: "Started",
      render: (row) =>
        row.startedDateTime
          ? new Date(String(row.startedDateTime)).toLocaleString()
          : "-",
    },
    {
      key: "finishedDateTime",
      label: "Finished",
      render: (row) =>
        row.finishedDateTime
          ? new Date(String(row.finishedDateTime)).toLocaleString()
          : "-",
    },
    {
      key: "deployedBy",
      label: "By",
      render: (row) => String(row.deployedBy ?? "-"),
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.headerTitle}>Deployments</h1>
          <p className={styles.headerSubtitle}>
            Deployment operations across environments
          </p>
        </div>
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
      </div>

      {isLoading && <LoadingSpinner message="Loading deployments..." />}
      {error && (
        <ErrorAlert message={error.message} onRetry={() => refetch()} />
      )}
      {data && (
        <DataTable
          columns={columns}
          data={data as Record<string, unknown>[]}
          keyField="key"
          emptyMessage="No deployments found"
        />
      )}
    </div>
  );
}
