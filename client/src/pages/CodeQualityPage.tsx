import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import {
  useQualityMetrics,
  useFindings,
  useFindingsSummary,
  type QualityMetric,
  type Finding,
} from "../hooks/useCodeQuality";
import { DataTable, Column } from "../components/DataTable";
import { StatusBadge } from "../components/StatusBadge";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorAlert } from "../components/ErrorAlert";
import styles from "../styles/pages.module.css";

function severityTotal(
  severity: QualityMetric["severity"],
): Record<string, number> {
  if (!severity) return {};
  const out: Record<string, number> = {};
  for (const [level, counts] of Object.entries(severity)) {
    out[level] = counts.latestFindingsCount ?? 0;
  }
  return out;
}

const metricColumns: Column<QualityMetric>[] = [
  {
    key: "assetName",
    label: "Asset",
    render: (row) => String(row.assetName || row.assetKey || "-"),
  },
  {
    key: "score",
    label: "Score",
    render: (row) => {
      if (!row.score?.latestScore && row.score?.latestScore !== 0) return "-";
      const diff = row.score.differenceScore;
      const arrow =
        diff && diff > 0 ? " ▲" + diff : diff && diff < 0 ? " ▼" + Math.abs(diff) : "";
      return `${row.score.latestScore}/100${arrow}`;
    },
  },
  {
    key: "critical",
    label: "Critical",
    render: (row) => String(severityTotal(row.severity)["Critical"] ?? 0),
  },
  {
    key: "high",
    label: "High",
    render: (row) => String(severityTotal(row.severity)["High"] ?? 0),
  },
  {
    key: "medium",
    label: "Medium",
    render: (row) => String(severityTotal(row.severity)["Medium"] ?? 0),
  },
  {
    key: "low",
    label: "Low",
    render: (row) => String(severityTotal(row.severity)["Low"] ?? 0),
  },
  {
    key: "assetRevision",
    label: "Revision",
    render: (row) => String(row.assetRevision ?? "-"),
  },
];

const findingColumns: Column<Finding>[] = [
  {
    key: "elementName",
    label: "Element",
    render: (row) => String(row.elementName || row.patternId || "-"),
  },
  {
    key: "elementType",
    label: "Type",
    render: (row) => String(row.elementType ?? "-"),
  },
  {
    key: "severity",
    label: "Severity",
    render: (row) =>
      row.severity ? <StatusBadge status={String(row.severity)} /> : "-",
  },
  {
    key: "status",
    label: "Status",
    render: (row) =>
      row.status ? <StatusBadge status={String(row.status)} /> : "-",
  },
  {
    key: "assetKey",
    label: "Asset",
    render: (row) => String(row.assetKey ?? "-"),
  },
  {
    key: "discoveredOn",
    label: "Discovered",
    render: (row) =>
      row.discoveredOn
        ? new Date(row.discoveredOn).toLocaleDateString()
        : "-",
  },
];

/** Flatten the nested summary results (category → status → severity → metric) into per-severity totals */
function flattenCategoryCounts(
  value: unknown,
): Record<string, number> {
  const totals: Record<string, number> = {};
  if (typeof value !== "object" || value === null) return totals;
  // level: status → severity → { latestFindingsCount }
  for (const statusObj of Object.values(value as Record<string, unknown>)) {
    if (typeof statusObj !== "object" || statusObj === null) continue;
    for (const [severity, metric] of Object.entries(
      statusObj as Record<string, unknown>,
    )) {
      if (
        typeof metric === "object" &&
        metric !== null &&
        "latestFindingsCount" in metric
      ) {
        totals[severity] =
          (totals[severity] ?? 0) +
          ((metric as { latestFindingsCount: number }).latestFindingsCount ?? 0);
      }
    }
  }
  return totals;
}

type Tab = "overview" | "findings";

export function CodeQualityPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [severityFilter, setSeverityFilter] = useState("");

  const metrics = useQualityMetrics();
  const summary = useFindingsSummary();
  const findingFilters = severityFilter
    ? { Severities: severityFilter }
    : undefined;
  const findings = useFindings(findingFilters);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.headerTitle}>Code Quality</h1>
          <p className={styles.headerSubtitle}>
            Quality metrics, findings, and analysis results
          </p>
        </div>
      </div>

      {/* Summary cards */}
      {summary.data && (
        <div className={styles.cardGrid}>
          {summary.data.totalFindings && (
            <>
              <div className={styles.card}>
                <div className={styles.cardMeta}>Total Findings</div>
                <div className={styles.cardTitle}>
                  {summary.data.totalFindings.latestFindingsCount}
                  {summary.data.totalFindings.findingsDifferenceCount !== 0 && (
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 400,
                        marginLeft: 8,
                        color:
                          summary.data.totalFindings.findingsDifferenceCount > 0
                            ? "var(--color-error)"
                            : "var(--color-success)",
                      }}
                    >
                      {summary.data.totalFindings.findingsDifferenceCount > 0
                        ? "+"
                        : ""}
                      {summary.data.totalFindings.findingsDifferenceCount}
                    </span>
                  )}
                </div>
              </div>
            </>
          )}
          {summary.data.results &&
            Object.entries(summary.data.results).map(([category, value]) => {
              const counts = flattenCategoryCounts(value);
              const total = Object.values(counts).reduce((s, n) => s + n, 0);
              return (
                <div className={styles.card} key={category}>
                  <div className={styles.cardMeta}>{category}</div>
                  <div className={styles.cardTitle}>{total}</div>
                  <div style={{ fontSize: 13, marginTop: 4 }}>
                    {Object.entries(counts).map(([severity, count]) => (
                      <div
                        key={severity}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          padding: "2px 0",
                        }}
                      >
                        <StatusBadge status={severity} />
                        <span style={{ fontWeight: 600 }}>{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Tabs */}
      <div className={styles.toolbar}>
        <button
          className={`${styles.btn} ${tab === "overview" ? styles.btnPrimary : styles.btnSecondary}`}
          onClick={() => setTab("overview")}
        >
          <ShieldCheck size={16} />
          Metrics Overview
        </button>
        <button
          className={`${styles.btn} ${tab === "findings" ? styles.btnPrimary : styles.btnSecondary}`}
          onClick={() => setTab("findings")}
        >
          Findings
        </button>
      </div>

      {tab === "overview" && (
        <>
          {metrics.isLoading && <LoadingSpinner />}
          {metrics.error && (
            <ErrorAlert
              message={metrics.error.message}
              onRetry={() => metrics.refetch()}
            />
          )}
          {metrics.data && metrics.data.length > 0 && (
            <DataTable
              data={metrics.data as (QualityMetric & Record<string, unknown>)[]}
              columns={metricColumns as Column<QualityMetric & Record<string, unknown>>[]}
              keyField="assetKey"
            />
          )}
          {metrics.data && metrics.data.length === 0 && (
            <p style={{ color: "var(--color-text-secondary)", fontSize: 14 }}>
              No quality metrics available yet.
            </p>
          )}
        </>
      )}

      {tab === "findings" && (
        <>
          <div className={styles.toolbar}>
            <select
              className={styles.select}
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
            >
              <option value="">All severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
          {findings.isLoading && <LoadingSpinner />}
          {findings.error && (
            <ErrorAlert
              message={findings.error.message}
              onRetry={() => findings.refetch()}
            />
          )}
          {findings.data && findings.data.length > 0 && (
            <DataTable
              data={findings.data as (Finding & Record<string, unknown>)[]}
              columns={findingColumns as Column<Finding & Record<string, unknown>>[]}
              keyField="id"
            />
          )}
          {findings.data && findings.data.length === 0 && (
            <p style={{ color: "var(--color-text-secondary)", fontSize: 14 }}>
              No findings match the current filter.
            </p>
          )}
        </>
      )}
    </div>
  );
}
