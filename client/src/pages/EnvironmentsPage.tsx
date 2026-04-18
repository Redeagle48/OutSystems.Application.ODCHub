import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Globe, Search, Rocket, AlertTriangle } from "lucide-react";
import { useEnvironments, useDeployedAssets } from "../hooks/usePortfolio";
import { DataTable, type Column } from "../components/DataTable";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorAlert } from "../components/ErrorAlert";
import { Blank } from "../components/Blank";
import { fmtRelative } from "../utils/format";
import pageStyles from "../styles/pages.module.css";
import styles from "../styles/environments.module.css";

interface DeploymentEntry {
  environmentKey?: string;
  revision?: number | string;
  deployedAt?: string;
  lastDeploymentDateTime?: string;
  finishedDateTime?: string;
  createdAt?: string;
  updatedAt?: string;
  name?: string;
  [k: string]: unknown;
}

const TS_FIELDS = [
  "deployedAt", "lastDeploymentDateTime", "finishedDateTime", "createdAt", "updatedAt",
] as const;

function getTs(d: DeploymentEntry): number {
  for (const f of TS_FIELDS) {
    const v = d[f];
    if (typeof v === "string" || typeof v === "number") {
      const t = new Date(v).getTime();
      if (!Number.isNaN(t)) return t;
    }
  }
  return -Infinity;
}

function getTsIso(d: DeploymentEntry): string | null {
  for (const f of TS_FIELDS) {
    const v = d[f];
    if (typeof v === "string") return v;
    if (typeof v === "number") return new Date(v).toISOString();
  }
  return null;
}

function latestPerEnv(deployments: DeploymentEntry[] | undefined) {
  const map = new Map<string, DeploymentEntry>();
  if (!deployments) return map;
  deployments.forEach((d, i) => {
    const k = String(d.environmentKey ?? "");
    const current = map.get(k);
    if (!current) { map.set(k, { ...d, __i: i }); return; }
    const a = getTs(d);
    const b = getTs(current);
    if (a > b || (a === b && i > (current.__i as number))) {
      map.set(k, { ...d, __i: i });
    }
  });
  return map;
}

export function EnvironmentsPage() {
  const envs = useEnvironments();
  const assets = useDeployedAssets();
  const [search, setSearch] = useState("");
  const [envFilter, setEnvFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  const environments = envs.data ?? [];
  const assetRows = (assets.data ?? []) as Record<string, unknown>[];

  // Per-env stats: #assets deployed, most recent deploy timestamp, latest revision seen.
  const envStats = useMemo(() => {
    const stats = new Map<string, { assetCount: number; lastDeployedAt: number; latestRev: number | string | null }>();
    environments.forEach((e) => stats.set(e.key, { assetCount: 0, lastDeployedAt: -Infinity, latestRev: null }));
    assetRows.forEach((row) => {
      const deployments = (row.deployments as DeploymentEntry[] | undefined) ?? [];
      const latest = latestPerEnv(deployments);
      latest.forEach((d, envKey) => {
        const s = stats.get(envKey);
        if (!s) return;
        s.assetCount += 1;
        const t = getTs(d);
        if (t > s.lastDeployedAt) {
          s.lastDeployedAt = t;
          s.latestRev = (d.revision as number | string | undefined) ?? s.latestRev;
        }
      });
    });
    return stats;
  }, [environments, assetRows]);

  // Asset type facets
  const types = useMemo(() => {
    const s = new Set<string>();
    assetRows.forEach((r) => { if (r.type) s.add(String(r.type)); });
    return Array.from(s).sort();
  }, [assetRows]);

  const filteredAssets = useMemo(() => {
    return assetRows.filter((row) => {
      if (typeFilter && String(row.type ?? "") !== typeFilter) return false;
      if (envFilter) {
        const deployments = (row.deployments as DeploymentEntry[] | undefined) ?? [];
        if (!deployments.some((d) => d.environmentKey === envFilter)) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        const name = (row.deployments as DeploymentEntry[] | undefined)?.[0]?.name ?? row.key;
        const hay = [String(name), String(row.key), String(row.type ?? "")].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [assetRows, search, envFilter, typeFilter]);

  if (envs.isLoading) return <LoadingSpinner message="Loading environments..." />;
  if (envs.error)
    return <ErrorAlert message={envs.error.message} onRetry={() => envs.refetch()} />;

  // Column for each environment, plus name/type.
  const assetColumns: Column<Record<string, unknown>>[] = [
    {
      key: "name",
      label: "Asset",
      render: (row) => {
        const deployments = row.deployments as DeploymentEntry[] | undefined;
        const name = deployments?.[0]?.name ? String(deployments[0].name) : String(row.key);
        return (
          <Link
            to={`/assets/${row.key}`}
            style={{ color: "var(--color-text)", fontWeight: 500, textDecoration: "none" }}
          >
            {name}
          </Link>
        );
      },
    },
    {
      key: "type",
      label: "Type",
      render: (row) => row.type
        ? <span style={{
            display: "inline-flex", padding: "2px 8px", borderRadius: 999,
            fontSize: 11.5, background: "#f1f5f9", color: "#475569", fontWeight: 500,
          }}>{String(row.type)}</span>
        : <Blank />,
    },
    ...environments.map<Column<Record<string, unknown>>>((env) => ({
      key: `env_${env.key}`,
      label: env.name || env.key,
      sortable: false,
      render: (row) => {
        const deployments = (row.deployments as DeploymentEntry[] | undefined) ?? [];
        const latest = latestPerEnv(deployments).get(env.key);
        if (!latest) return <Blank reason="Not deployed" />;
        const rev = latest.revision;
        const ts = getTsIso(latest);
        // Is this env behind the max revision seen for this asset?
        const allRevs = Array.from(latestPerEnv(deployments).values())
          .map((d) => Number(d.revision))
          .filter((n) => !Number.isNaN(n));
        const maxRev = allRevs.length ? Math.max(...allRevs) : null;
        const behind = maxRev != null && Number(rev) < maxRev;
        const cls = behind ? styles.matrixCellBehind : styles.matrixCellLive;
        return (
          <span className={`${styles.matrixCell} ${cls}`} title={ts ?? undefined}>
            <span className={styles.matrixRev}>
              {rev != null ? `r${rev}` : "?"}
            </span>
            {ts && <span className={styles.matrixSub}>· {fmtRelative(ts)}</span>}
          </span>
        );
      },
    })),
  ];

  return (
    <div className={pageStyles.page}>
      {/* Header */}
      <div className={pageStyles.header}>
        <div>
          <h1 className={pageStyles.headerTitle}>Environments</h1>
          <p className={pageStyles.headerSubtitle}>
            What's running where · {environments.length} environments · {assetRows.length} assets
          </p>
        </div>
      </div>

      {/* Environment cards — clickable filter */}
      {environments.length === 0 ? (
        <p style={{ color: "var(--color-text-secondary)" }}>
          No environments found. Check your ODC connection settings.
        </p>
      ) : (
        <div className={styles.envGrid}>
          {environments.map((env) => {
            const s = envStats.get(env.key);
            const active = envFilter === env.key;
            return (
              <button
                key={env.key}
                className={`${styles.envCard} ${active ? styles.envCardActive : ""}`}
                onClick={() => setEnvFilter(active ? null : env.key)}
                aria-pressed={active}
              >
                <div className={styles.envHead}>
                  <Globe size={15} color={active ? "var(--color-primary)" : "#64748b"} />
                  <span className={styles.envName}>{env.name || env.key}</span>
                  <span
                    className={styles.dot}
                    style={{ background: s && s.assetCount > 0 ? "#16a34a" : "#cbd5e1" }}
                    aria-hidden
                  />
                </div>
                <div className={styles.envStat}>
                  <span className={styles.envStatNum}>{s?.assetCount ?? 0}</span>
                  <span className={styles.envStatLabel}>assets deployed</span>
                </div>
                <div className={styles.envMeta}>
                  <Rocket size={11} />
                  {s && s.lastDeployedAt !== -Infinity
                    ? <>Latest deploy {fmtRelative(new Date(s.lastDeployedAt).toISOString())}</>
                    : <>No recent deployments</>}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Asset matrix */}
      <div className={styles.sectionHead}>
        <h2 className={styles.sectionTitle}>Deployed assets</h2>
        <span className={styles.sectionHint}>
          Each cell shows the revision running in that environment. <span style={{ color: "#a06a00" }}>Amber</span> means behind the newest revision for that asset.
        </span>
      </div>

      <div className={styles.toolbar}>
        <label className={styles.searchBox}>
          <Search size={14} color="#94a3b8" />
          <input
            placeholder="Search assets by name or key…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        {types.map((t) => (
          <button
            key={t}
            className={`${styles.chip} ${typeFilter === t ? styles.chipActive : ""}`}
            onClick={() => setTypeFilter(typeFilter === t ? null : t)}
          >
            {t}
          </button>
        ))}
        {envFilter && (
          <button
            className={`${styles.chip} ${styles.chipActive}`}
            onClick={() => setEnvFilter(null)}
            title="Clear environment filter"
          >
            Env: {environments.find((e) => e.key === envFilter)?.name ?? envFilter} ✕
          </button>
        )}
      </div>

      {assets.isLoading && <LoadingSpinner message="Loading deployed assets..." />}
      {assets.error && (
        <ErrorAlert message={assets.error.message} onRetry={() => assets.refetch()} />
      )}
      {assets.data && (
        <DataTable
          columns={assetColumns}
          data={filteredAssets}
          keyField="key"
          emptyMessage={search || envFilter || typeFilter
            ? "No assets match your filters"
            : "No deployed assets found"}
        />
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--color-text-secondary)", fontSize: 12, marginTop: 4 }}>
        <AlertTriangle size={12} />
        Drift detection compares each asset's deployed revisions across its environments — it isn't a portfolio-wide "latest available" check.
      </div>
    </div>
  );
}
