import { useState } from "react";
import { Link } from "react-router-dom";
import { useAssets } from "../hooks/useAssets";
import { DataTable, type Column } from "../components/DataTable";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorAlert } from "../components/ErrorAlert";
import styles from "../styles/pages.module.css";

const assetTypes = [
  { label: "All", value: "" },
  { label: "Web Application", value: "WebApplication" },
  { label: "Mobile Application", value: "MobileApplication" },
  { label: "Low-Code Library", value: "LowCodeLibrary" },
  { label: "Extension Library", value: "ExtensionLibrary" },
  { label: "External Library", value: "ExternalLibrary" },
  { label: "Widget Library", value: "WidgetLibrary" },
  { label: "Mobile Library", value: "MobileLibrary" },
  { label: "Workflow", value: "Workflow" },
  { label: "Agent", value: "Agent" },
  { label: "AI Model Connection", value: "AIModelConnection" },
];

export function AssetsPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const filters: Record<string, string> = {};
  if (typeFilter) filters.assetTypes = typeFilter;
  if (search) filters.nameContains = search;

  const { data, isLoading, error, refetch } = useAssets(
    Object.keys(filters).length ? filters : undefined,
  );

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: "name",
      label: "Name",
      render: (row) => (
        <Link
          to={`/assets/${row.assetKey}`}
          style={{ color: "var(--color-primary)", textDecoration: "none", fontWeight: 500 }}
        >
          {String(row.name || row.assetKey)}
        </Link>
      ),
    },
    { key: "assetType", label: "Type" },
    {
      key: "revision",
      label: "Revision",
      render: (row) => {
        const rev = row.revision != null ? String(row.revision) : "-";
        const tag = row.tag ? ` (${row.tag})` : "";
        return rev + tag;
      },
    },
    {
      key: "revisionDateTime",
      label: "Last Modified",
      render: (row) =>
        row.revisionDateTime
          ? new Date(String(row.revisionDateTime)).toLocaleString()
          : "-",
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.headerTitle}>Assets</h1>
          <p className={styles.headerSubtitle}>
            Browse the ODC asset repository
          </p>
        </div>
      </div>

      <div className={styles.toolbar}>
        <input
          className={styles.searchInput}
          placeholder="Search assets by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className={styles.select}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          {assetTypes.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {isLoading && <LoadingSpinner message="Loading assets..." />}
      {error && (
        <ErrorAlert message={error.message} onRetry={() => refetch()} />
      )}
      {data && (
        <DataTable
          columns={columns}
          data={data as Record<string, unknown>[]}
          keyField="assetKey"
          emptyMessage="No assets found"
        />
      )}
    </div>
  );
}
