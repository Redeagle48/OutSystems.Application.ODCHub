import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  RefreshCw, Rocket, Search, ArrowRight, MoreHorizontal,
  RotateCcw, FileText, Copy, Check, AlertTriangle, Globe,
} from "lucide-react";
import { useDeployments } from "../hooks/useDeployments";
import { useUsers } from "../hooks/useUsers";
import { DataTable, type Column } from "../components/DataTable";
import { StatusBadge } from "../components/StatusBadge";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorAlert } from "../components/ErrorAlert";
import { Blank, Author } from "../components/Blank";
import { fmtRelative, fmtExact } from "../utils/format";
import styles from "../styles/deployments.module.css";
import pageStyles from "../styles/pages.module.css";

type StatusFilter = "all" | "running" | "success" | "failed";

function classifyStatus(s: string | null | undefined): StatusFilter {
  const x = (s ?? "").toLowerCase();
  if (!x) return "all";
  if (x.includes("fail") || x.includes("error") || x === "critical") return "failed";
  if (x.includes("run") || x === "pending" || x === "queued" || x === "in_progress") return "running";
  if (x.includes("fin") || x.includes("success") || x === "completed" || x === "closed") return "success";
  return "all";
}

function durationMs(start: string | null | undefined, end: string | null | undefined): number | null {
  if (!start || !end) return null;
  const a = new Date(start).getTime();
  const b = new Date(end).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return Math.max(0, b - a);
}

function fmtDuration(ms: number | null): string {
  if (ms == null) return "";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m < 60) return r ? `${m}m ${r}s` : `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

function CopyBtn({ value }: { value: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      className={styles.btnGhost}
      title="Copy deployment key"
      onClick={(e) => {
        e.stopPropagation();
        try { navigator.clipboard.writeText(value); } catch { /* ignore */ }
        setDone(true);
        setTimeout(() => setDone(false), 1100);
      }}
    >
      {done ? <Check size={13} color="#16a34a" /> : <Copy size={13} />}
    </button>
  );
}

function RouteCell({ src, tgt }: { src?: string | null; tgt?: string | null }) {
  if (!src && !tgt) return <Blank reason="No route" />;
  return (
    <span className={styles.routeCell}>
      <strong>{src ?? "?"}</strong>
      <ArrowRight size={12} color="#94a3b8" />
      <strong>{tgt ?? "?"}</strong>
    </span>
  );
}

function TimeCell({ iso }: { iso: string | null | undefined }) {
  if (!iso) return <Blank reason="Unknown" />;
  return (
    <span className={styles.timeCell}>
      <span className={styles.timeRel}>{fmtRelative(iso)}</span>
      <span className={styles.timeAbs}>{fmtExact(iso)}</span>
    </span>
  );
}

export function DeploymentsPage() {
  const { data, isLoading, error, refetch, isFetching } = useDeployments();
  const { data: users } = useUsers();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [envFilter, setEnvFilter] = useState<string>("");

  const userNameByKey = useMemo(
    () => new Map((users ?? []).map((u) => [u.key, u.name] as const)),
    [users],
  );

  const rows = useMemo(() => (data ?? []) as Record<string, unknown>[], [data]);

  // Collect envs + per-env stats
  const { envs, byEnv } = useMemo(() => {
    const m = new Map<string, Record<string, unknown>[]>();
    for (const r of rows) {
      const src = String(r.sourceEnvironment ?? "");
      const tgt = String(r.targetEnvironment ?? "");
      const key = tgt || src || "—";
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(r);
    }
    const envList = Array.from(m.keys()).filter(Boolean).sort();
    return { envs: envList, byEnv: m };
  }, [rows]);

  const statusCounts = useMemo(() => {
    const c = { all: rows.length, running: 0, success: 0, failed: 0 };
    for (const r of rows) {
      const k = classifyStatus(r.status as string);
      if (k === "running") c.running++;
      else if (k === "failed") c.failed++;
      else if (k === "success") c.success++;
    }
    return c;
  }, [rows]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (statusFilter !== "all" && classifyStatus(r.status as string) !== statusFilter) return false;
      if (envFilter) {
        const tgt = String(r.targetEnvironment ?? "");
        const src = String(r.sourceEnvironment ?? "");
        if (tgt !== envFilter && src !== envFilter) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        const hay = [
          r.assetName, r.assetKey, r.operation, r.status,
          r.sourceEnvironment, r.targetEnvironment, r.deployedBy,
          Array.isArray(r.revisions) ? r.revisions.join(" ") : "",
        ].map((x) => String(x ?? "")).join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rows, statusFilter, envFilter, search]);

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: "status", label: "Status",
      render: (row) => row.status ? <StatusBadge status={String(row.status)} /> : <Blank />,
    },
    {
      key: "assetName", label: "Asset",
      render: (row) =>
        row.assetKey ? (
          <Link
            to={`/assets/${row.assetKey}`}
            style={{ color: "var(--color-text)", textDecoration: "none", fontWeight: 500 }}
          >
            {String(row.assetName || row.assetKey)}
          </Link>
        ) : row.assetName ? String(row.assetName) : <Blank reason="Unlinked" />,
    },
    {
      key: "targetEnvironment", label: "Route",
      render: (row) => (
        <RouteCell
          src={row.sourceEnvironment as string | null}
          tgt={row.targetEnvironment as string | null}
        />
      ),
    },
    {
      key: "operation", label: "Operation",
      render: (row) => row.operation
        ? <span className={styles.pill + " " + styles.pillOutline}>{String(row.operation)}</span>
        : <Blank />,
    },
    {
      key: "revisions", label: "Revisions",
      render: (row) => Array.isArray(row.revisions) && row.revisions.length
        ? <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 12.5 }}>
            {(row.revisions as number[]).map((x) => `r${x}`).join(", ")}
          </span>
        : <Blank reason="None" />,
    },
    {
      key: "startedDateTime", label: "Started",
      render: (row) => <TimeCell iso={row.startedDateTime as string | null} />,
    },
    {
      key: "duration", label: "Duration", sortable: false,
      render: (row) => {
        const ms = durationMs(
          row.startedDateTime as string | null,
          row.finishedDateTime as string | null,
        );
        if (ms == null) {
          return row.finishedDateTime == null
            ? <span className={`${styles.pill} ${styles.pillWarn}`}>in progress</span>
            : <Blank />;
        }
        return <span className={styles.duration}>{fmtDuration(ms)}</span>;
      },
    },
    {
      key: "deployedBy", label: "By",
      render: (row) => {
        if (!row.deployedBy) return <Blank reason="Unknown" />;
        const id = String(row.deployedBy);
        if (id === "00000000-0000-0000-0000-000000000000") {
          return <span className={styles.pill + " " + styles.pillOutline}>system</span>;
        }
        const name = userNameByKey.get(id);
        return <Author name={name ?? id} />;
      },
    },
    {
      key: "_actions", label: "", sortable: false,
      render: (row) => (
        <span className={styles.rowActions} onClick={(e) => e.stopPropagation()}>
          <button className={styles.btnGhost} title="View logs">
            <FileText size={13} />
          </button>
          <button className={styles.btnGhost} title="Re-run deployment">
            <RotateCcw size={13} />
          </button>
          <CopyBtn value={String(row.key ?? "")} />
          <button className={styles.btnGhost} title="More">
            <MoreHorizontal size={13} />
          </button>
        </span>
      ),
    },
  ];

  return (
    <div className={pageStyles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>
            Deployments
            <span className={styles.countPill}>{rows.length}</span>
          </h1>
          <p className={styles.sub}>
            Live status and recent operations across all environments
          </p>
        </div>
        <div className={styles.actions}>
          <button
            className={styles.btn}
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw size={14} className={isFetching ? "spin" : ""} />
            {isFetching ? "Refreshing…" : "Refresh"}
          </button>
          <button className={`${styles.btn} ${styles.btnPrimary}`}>
            <Rocket size={14} /> New deployment…
          </button>
        </div>
      </div>

      {/* Environment strip */}
      {envs.length > 0 && (
        <div className={styles.envStrip}>
          {envs.slice(0, 6).map((env) => {
            const items = byEnv.get(env) ?? [];
            const latest = items[0];
            const running = items.filter((r) => classifyStatus(r.status as string) === "running").length;
            const failed = items.filter((r) => classifyStatus(r.status as string) === "failed").length;
            const latestStatus = classifyStatus(latest?.status as string);
            const dotColor =
              latestStatus === "failed" ? "#dc2626" :
              latestStatus === "running" ? "#2563eb" :
              latestStatus === "success" ? "#16a34a" : "#94a3b8";
            return (
              <button
                key={env}
                className={styles.envCard}
                onClick={() => setEnvFilter(envFilter === env ? "" : env)}
                style={{
                  textAlign: "left",
                  cursor: "pointer",
                  borderColor: envFilter === env ? "var(--color-primary)" : undefined,
                }}
              >
                <span className={styles.envCardAccent} style={{ background: dotColor }} />
                <div className={styles.envName}>
                  <Globe size={11} style={{ marginRight: 4, verticalAlign: "-1px" }} />
                  Environment
                </div>
                <div className={styles.envRoute}>{env}</div>
                <div className={styles.envMeta}>
                  {latest?.status ? (
                    <>
                      Last: <StatusBadge status={String(latest.status)} />
                      <span>{fmtRelative(latest.startedDateTime as string | null)}</span>
                    </>
                  ) : (
                    <Blank reason="No deployments" />
                  )}
                </div>
                <div className={styles.envStats}>
                  <div><strong>{items.length}</strong> total</div>
                  {running > 0 && <div><strong style={{ color: "#2563eb" }}>{running}</strong> running</div>}
                  {failed > 0 && <div><strong style={{ color: "#dc2626" }}>{failed}</strong> failed</div>}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <label className={styles.searchBox}>
          <Search size={14} color="#94a3b8" />
          <input
            placeholder="Search asset, operation, user, revision…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>

        <div className={styles.chipGroup} role="tablist">
          {([
            ["all", "All", statusCounts.all],
            ["running", "Running", statusCounts.running],
            ["success", "Succeeded", statusCounts.success],
            ["failed", "Failed", statusCounts.failed],
          ] as const).map(([k, label, n]) => (
            <button
              key={k}
              className={`${styles.chip} ${statusFilter === k ? styles.chipActive : ""}`}
              onClick={() => setStatusFilter(k)}
            >
              {label}
              <span style={{ fontSize: 11, opacity: .85 }}>{n}</span>
            </button>
          ))}
        </div>

        {envs.length > 0 && (
          <select
            className={styles.filterSelect}
            value={envFilter}
            onChange={(e) => setEnvFilter(e.target.value)}
          >
            <option value="">All environments</option>
            {envs.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
        )}

        {(envFilter || statusFilter !== "all" || search) && (
          <button
            className={styles.btnGhost}
            onClick={() => { setEnvFilter(""); setStatusFilter("all"); setSearch(""); }}
          >
            Clear filters
          </button>
        )}

        <div className={styles.right}>
          <span style={{ fontSize: 12.5, color: "var(--color-text-secondary)" }}>
            Showing <strong style={{ color: "var(--color-text)" }}>{filtered.length}</strong> of {rows.length}
          </span>
        </div>
      </div>

      {isLoading && <LoadingSpinner message="Loading deployments..." />}
      {error && <ErrorAlert message={error.message} onRetry={() => refetch()} />}
      {data && filtered.length > 0 && (
        <DataTable
          columns={columns}
          data={filtered}
          keyField="key"
          emptyMessage="No deployments match your filters"
        />
      )}
      {data && filtered.length === 0 && rows.length > 0 && (
        <div className={styles.emptyHint}>
          <AlertTriangle size={22} />
          <h3>No deployments match your filters</h3>
          <p>Try clearing a filter or broadening your search.</p>
        </div>
      )}
      {data && rows.length === 0 && (
        <div className={styles.emptyHint}>
          <Rocket size={22} />
          <h3>No deployments yet</h3>
          <p>Kick off a deployment from an asset page or via the portal API.</p>
        </div>
      )}
    </div>
  );
}
