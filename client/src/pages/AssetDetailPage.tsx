import { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft, Box, Rocket, Download, Star, Tag as TagIcon,
  GitCommit, Search, Filter, Clock, Globe, GitBranch,
  ChevronRight, Copy, Check, AlertTriangle, Link as LinkIcon,
} from "lucide-react";
import {
  useAssetDetail,
  useAssetRevisions,
  useAssetBuilds,
  useAssetDeployments,
  useAssetConsumers,
  useAssetProducers,
  useAssetFindings,
  type Build,
  type DeploymentOp,
  type AssetDependency,
  type AssetRevision,
} from "../hooks/useAssetDetail";
import { DataTable, type Column } from "../components/DataTable";
import { StatusBadge } from "../components/StatusBadge";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorAlert } from "../components/ErrorAlert";
import { Blank, Author } from "../components/Blank";
import { fmtRelative, fmtExact } from "../utils/format";
import styles from "../styles/assetDetail.module.css";
import pageStyles from "../styles/pages.module.css";

type Tab = "revisions" | "builds" | "deployments" | "dependencies" | "quality";

function TimeCell({ iso }: { iso: string | null | undefined }) {
  if (!iso) return <Blank reason="Unknown" />;
  return (
    <span className={styles.timeCell}>
      <span className={styles.timeRel}>{fmtRelative(iso)}</span>
      <span className={styles.timeAbs + " " + styles.mono}>{fmtExact(iso)}</span>
    </span>
  );
}

function TagPill({ tag }: { tag: string | null | undefined }) {
  if (!tag) return <Blank reason="Untagged" />;
  return (
    <span className={`${styles.pill} ${styles.pillAccent}`}>
      <TagIcon size={11} /> <span className={styles.mono}>{tag}</span>
    </span>
  );
}

function CommitCell({ msg }: { msg: string | null | undefined }) {
  if (!msg) return <Blank reason="No commit message" />;
  return (
    <span className={styles.commitCell} title={msg}>
      <GitCommit size={13} color="#94a3b8" />
      <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{msg}</span>
    </span>
  );
}

function CopyBtn({ value }: { value: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      className={styles.btnGhost}
      style={{ padding: 4 }}
      title="Copy"
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

export function AssetDetailPage() {
  const { assetKey } = useParams<{ assetKey: string }>();
  const [tab, setTab] = useState<Tab>("revisions");
  const [search, setSearch] = useState("");
  const [taggedOnly, setTaggedOnly] = useState(false);
  const [buildRevision, setBuildRevision] = useState<number | null>(null);

  const detail = useAssetDetail(assetKey ?? null);
  const revisions = useAssetRevisions(assetKey ?? null);

  const effectiveRev = buildRevision ?? detail.data?.revision ?? null;
  const builds = useAssetBuilds(assetKey ?? null, effectiveRev);
  const deployments = useAssetDeployments(assetKey ?? null);
  const consumers = useAssetConsumers(assetKey ?? null);
  const producers = useAssetProducers(assetKey ?? null, detail.data?.revision ?? null);
  const findings = useAssetFindings(assetKey ?? null);

  const filteredRevisions = useMemo(() => {
    const rows = revisions.data ?? [];
    return rows.filter((r) => {
      if (taggedOnly && !r.tag) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = [
          String(r.revision),
          r.tag ?? "", r.commitMessage ?? "", r.createdBy ?? "", r.name ?? "",
        ].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [revisions.data, search, taggedOnly]);

  if (detail.isLoading) return <LoadingSpinner message="Loading asset..." />;
  if (detail.error)
    return <ErrorAlert message={detail.error.message} onRetry={() => detail.refetch()} />;

  const asset = detail.data;
  if (!asset) return null;

  const revisionCols: Column<AssetRevision & Record<string, unknown>>[] = [
    {
      key: "revision", label: "Rev",
      render: (r) => <strong className={styles.mono}>r{r.revision}</strong>,
    },
    { key: "tag", label: "Tag", render: (r) => <TagPill tag={r.tag} /> },
    {
      key: "createdAt", label: "Created",
      render: (r) => <TimeCell iso={r.createdAt || r.revisionDateTime} />,
    },
    { key: "commitMessage", label: "Commit", render: (r) => <CommitCell msg={r.commitMessage} /> },
    { key: "createdBy", label: "By", render: (r) => <Author name={r.createdBy} /> },
    {
      key: "_actions", label: "", sortable: false,
      render: (r) => <CopyBtn value={String(r.revision)} />,
    },
  ];

  const buildCols: Column<Build & Record<string, unknown>>[] = [
    { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
    { key: "buildType", label: "Type" },
    {
      key: "assetRevision", label: "Revision",
      render: (r) => <span className={styles.mono}>r{r.assetRevision}</span>,
    },
    { key: "startedDateTime", label: "Started", render: (r) => <TimeCell iso={r.startedDateTime} /> },
    {
      key: "finishedDateTime", label: "Finished",
      render: (r) => r.finishedDateTime ? <TimeCell iso={r.finishedDateTime} /> : <Blank reason="Running" />,
    },
    { key: "builtBy", label: "By", render: (r) => <Author name={r.builtBy} /> },
  ];

  const deployCols: Column<DeploymentOp & Record<string, unknown>>[] = [
    { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
    { key: "operation", label: "Operation" },
    {
      key: "revisions", label: "Revisions",
      render: (r) => r.revisions && r.revisions.length
        ? <span className={styles.mono}>{r.revisions.map((x) => `r${x}`).join(", ")}</span>
        : <Blank reason="No revisions" />,
    },
    { key: "startedDateTime", label: "Started", render: (r) => <TimeCell iso={r.startedDateTime} /> },
    {
      key: "finishedDateTime", label: "Finished",
      render: (r) => r.finishedDateTime ? <TimeCell iso={r.finishedDateTime} /> : <Blank reason="Running" />,
    },
    { key: "deployedBy", label: "By", render: (r) => <Author name={r.deployedBy} /> },
  ];

  const depCols: Column<AssetDependency & Record<string, unknown>>[] = [
    {
      key: "name", label: "Name",
      render: (r) => (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <GitBranch size={13} color="#94a3b8" />
          <span className={styles.mono}>{String(r.name ?? r.key)}</span>
        </span>
      ),
    },
    {
      key: "type", label: "Type",
      render: (r) => r.type ? <span className={`${styles.pill} ${styles.pillNeutral}`}>{String(r.type)}</span> : <Blank />,
    },
    {
      key: "revision", label: "Revision",
      render: (r) => <span className={styles.mono}>r{r.revision}</span>,
    },
    {
      key: "isDirectProducer", label: "Direct",
      render: (r) => r.isDirectProducer == null ? <Blank /> :
        r.isDirectProducer
          ? <span className={`${styles.pill} ${styles.pillOk}`}><Check size={11} /> Direct</span>
          : <span className={`${styles.pill} ${styles.pillOutline}`}>Transitive</span>,
    },
  ];

  const findingCols: Column<Record<string, unknown>>[] = [
    {
      key: "elementName", label: "Element",
      render: (r) => String(r.elementName || r.patternId || "") || <Blank reason="Unnamed" />,
    },
    {
      key: "elementType", label: "Type",
      render: (r) => r.elementType
        ? <span className={`${styles.pill} ${styles.pillNeutral}`}>{String(r.elementType)}</span>
        : <Blank />,
    },
    { key: "severity", label: "Severity", render: (r) => r.severity ? <StatusBadge status={String(r.severity)} /> : <Blank /> },
    { key: "status", label: "Status", render: (r) => r.status ? <StatusBadge status={String(r.status)} /> : <Blank /> },
    {
      key: "discoveredOn", label: "Discovered",
      render: (r) => r.discoveredOn ? <TimeCell iso={String(r.discoveredOn)} /> : <Blank />,
    },
  ];

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "revisions", label: "Revisions", count: revisions.data?.length },
    { key: "builds", label: "Builds", count: builds.data?.length },
    { key: "deployments", label: "Deployments", count: deployments.data?.length },
    {
      key: "dependencies", label: "Dependencies",
      count: (producers.data?.length ?? 0) + (consumers.data?.length ?? 0) || undefined,
    },
    { key: "quality", label: "Code Quality", count: findings.data?.length },
  ];

  const latestRev = revisions.data?.[0];

  return (
    <div className={pageStyles.page}>
      {/* Breadcrumb */}
      <div>
        <div className={styles.breadcrumb}>
          <Link to="/assets"><ArrowLeft size={13} /> Assets</Link>
          <ChevronRight size={12} className={styles.crumbSep} />
          <span style={{ color: "var(--color-text)" }}>{asset.name}</span>
        </div>

        {/* Title row */}
        <div className={styles.titleRow}>
          <div className={styles.icon}><Box size={22} /></div>
          <div className={styles.titleMain}>
            <div className={styles.titleLine}>
              <h1 className={styles.h1}>{asset.name}</h1>
              <span className={`${styles.pill} ${styles.pillOk}`}>
                <span className={styles.dot} style={{ background: "#16a34a" }} /> Healthy
              </span>
              {asset.assetType && (
                <span className={`${styles.pill} ${styles.pillOutline}`}>
                  <Box size={11} /> {asset.assetType}
                </span>
              )}
              <span className={styles.crumbSep}>·</span>
              <span className={styles.mono} style={{ color: "var(--color-text-secondary)" }}>
                {asset.assetKey.slice(0, 8)}
              </span>
              <CopyBtn value={asset.assetKey} />
            </div>
            {asset.description
              ? <div className={styles.desc}>{asset.description}</div>
              : <div className={styles.desc}><Blank reason="No description" /></div>}
          </div>
          <div className={styles.actions}>
            <button className={styles.btn}><Star size={14} /> Watch</button>
            <button className={styles.btn}><Download size={14} /> Export</button>
            <button className={`${styles.btn} ${styles.btnPrimary}`}>
              <Rocket size={14} /> Deploy latest…
            </button>
          </div>
        </div>
      </div>

      {/* Summary strip */}
      <div className={styles.summary}>
        <div className={styles.summaryCard}>
          <div className={styles.sumLabel}><GitCommit size={13} /> Current revision</div>
          <div className={styles.sumValue}>
            <strong className={styles.mono}>r{asset.revision}</strong>
            <TagPill tag={asset.tag} />
          </div>
          <div className={styles.sumSub}>
            Last revision <strong style={{ color: "var(--color-text)" }}>
              {fmtRelative(asset.revisionDateTime || asset.createdAt)}
            </strong>
            {asset.createdBy ? <> · by {asset.createdBy}</> : null}
          </div>
          <div className={styles.sumActions}>
            <button className={styles.btn}><TagIcon size={13} /> Tag…</button>
            <button className={styles.btn}><LinkIcon size={13} /> Compare</button>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.sumLabel}><Clock size={13} /> Activity</div>
          <div className={styles.sumValue}>
            <strong>{revisions.data?.length ?? 0}</strong>
            <span style={{ color: "var(--color-text-secondary)", fontSize: 12.5 }}>revisions tracked</span>
          </div>
          <div className={styles.sumSub}>
            {builds.data?.length ?? 0} builds · {deployments.data?.length ?? 0} deployments
          </div>
          <div className={styles.sumActions}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 32, flex: 1 }}>
              {[2,3,1,2,4,3,5,2,6,4,7,5,4,6,3,2,4,5,3,6].map((v, i, arr) => (
                <div key={i} style={{
                  flex: 1,
                  height: `${10 + (v / 8) * 80}%`,
                  background: i === arr.length - 1 ? "var(--color-primary)" : "#e2e8f0",
                  borderRadius: 2,
                }} />
              ))}
            </div>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.sumLabel}>
            <Globe size={13} /> Environments
            <span style={{ marginLeft: "auto", fontSize: 11.5, color: "#94a3b8", fontWeight: 500, textTransform: "none", letterSpacing: 0 }}>
              live status
            </span>
          </div>
          <div className={styles.envGrid} style={{ marginTop: 10 }}>
            {deployments.data && deployments.data.length > 0 ? (
              Array.from(new Map(
                deployments.data.filter((d) => d.assetName).slice(0, 4)
                  .map((d) => [d.operation + (d.revisions?.[0] ?? ""), d] as const)
              ).values()).slice(0, 4).map((d, i) => (
                <div key={i} className={styles.envCell}>
                  <span
                    className={styles.dot}
                    style={{ background: d.status.toLowerCase().includes("fin") ? "#16a34a" : "#94a3b8" }}
                  />
                  <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 600 }}>{d.operation}</span>
                    <small>
                      <span className={styles.mono}>r{d.revisions?.[0] ?? "?"}</span>
                      {" · "}{fmtRelative(d.startedDateTime)}
                    </small>
                  </div>
                </div>
              ))
            ) : (
              <Blank reason="No recent deployments" />
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`${styles.tab} ${tab === t.key ? styles.tabActive : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
            {t.count != null && <span className={styles.tabCount}>{t.count}</span>}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "revisions" && (
        <TabSection loading={revisions.isLoading} error={revisions.error} onRetry={() => revisions.refetch()}>
          <div className={styles.toolbar}>
            <label className={styles.searchBox}>
              <Search size={14} color="#94a3b8" />
              <input
                placeholder="Search by rev, tag, commit, author…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <button
              className={`${styles.chip} ${taggedOnly ? styles.chipActive : ""}`}
              onClick={() => setTaggedOnly((v) => !v)}
            >
              <TagIcon size={12} /> Tagged only
            </button>
            <div className={styles.rightTools}>
              <button className={styles.btnGhost}><Filter size={13} /> More filters</button>
            </div>
          </div>
          <DataTable
            data={filteredRevisions as (AssetRevision & Record<string, unknown>)[]}
            columns={revisionCols}
            keyField="revision"
            emptyMessage={search || taggedOnly ? "No revisions match your filters" : "No revisions found"}
          />
        </TabSection>
      )}

      {tab === "builds" && (
        <>
          {revisions.data && revisions.data.length > 1 && (
            <div className={styles.toolbar}>
              <label style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>Revision:</label>
              <select
                className={pageStyles.select}
                value={effectiveRev ?? ""}
                onChange={(e) => setBuildRevision(Number(e.target.value))}
              >
                {revisions.data.map((r) => (
                  <option key={r.revision} value={r.revision}>
                    r{r.revision}{r.tag ? ` — ${r.tag}` : ""}
                  </option>
                ))}
              </select>
              {latestRev && effectiveRev !== latestRev.revision && (
                <button className={styles.btn} onClick={() => setBuildRevision(latestRev.revision)}>
                  Jump to latest (r{latestRev.revision})
                </button>
              )}
            </div>
          )}
          <TabSection loading={builds.isLoading} error={builds.error} onRetry={() => builds.refetch()}>
            <DataTable
              data={(builds.data ?? []) as (Build & Record<string, unknown>)[]}
              columns={buildCols}
              keyField="buildKey"
              emptyMessage="No builds for this revision"
            />
          </TabSection>
        </>
      )}

      {tab === "deployments" && (
        <TabSection loading={deployments.isLoading} error={deployments.error} onRetry={() => deployments.refetch()}>
          <DataTable
            data={(deployments.data ?? []) as (DeploymentOp & Record<string, unknown>)[]}
            columns={deployCols}
            keyField="key"
            emptyMessage="No deployment operations found"
          />
        </TabSection>
      )}

      {tab === "dependencies" && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Producers</h3>
            <span style={{ fontSize: 12.5, color: "var(--color-text-secondary)" }}>
              Dependencies this asset uses
            </span>
          </div>
          <TabSection loading={producers.isLoading} error={producers.error} onRetry={() => producers.refetch()}>
            <DataTable
              data={(producers.data ?? []) as (AssetDependency & Record<string, unknown>)[]}
              columns={depCols}
              keyField="key"
              emptyMessage="No producers found"
            />
          </TabSection>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Consumers</h3>
            <span style={{ fontSize: 12.5, color: "var(--color-text-secondary)" }}>
              Assets that depend on this
            </span>
          </div>
          <TabSection loading={consumers.isLoading} error={consumers.error} onRetry={() => consumers.refetch()}>
            <DataTable
              data={(consumers.data ?? []) as (AssetDependency & Record<string, unknown>)[]}
              columns={depCols}
              keyField="key"
              emptyMessage="No consumers found"
            />
          </TabSection>
        </>
      )}

      {tab === "quality" && (
        <TabSection loading={findings.isLoading} error={findings.error} onRetry={() => findings.refetch()}>
          <DataTable
            data={findings.data ?? []}
            columns={findingCols}
            keyField="id"
            emptyMessage="No code quality findings"
            renderExpanded={(row) => {
              const fields: { label: string; value: string }[] = [
                { label: "Pattern", value: String(row.patternId ?? "—") },
                {
                  label: "Where",
                  value: row.whereElementName
                    ? `${row.whereElementName}${row.whereElementType ? ` (${row.whereElementType})` : ""}`
                    : "—",
                },
                { label: "Revision", value: String(row.assetRevision ?? "—") },
              ];
              if (row.dismissReason) {
                fields.push({ label: "Dismiss reason", value: String(row.dismissReason) });
              }
              return (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 40px", fontSize: 13 }}>
                  {fields.map(({ label, value }) => (
                    <div key={label}>
                      <span style={{ color: "var(--color-text-secondary)", marginRight: 4 }}>{label}:</span>
                      <strong>{value}</strong>
                    </div>
                  ))}
                </div>
              );
            }}
          />
        </TabSection>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--color-text-secondary)", fontSize: 12, marginTop: 8 }}>
        <AlertTriangle size={12} />
        Health and environment cells above are illustrative — wire to `/environments` and `/builds` aggregates to make them live.
      </div>
    </div>
  );
}

function TabSection({
  loading, error, onRetry, children,
}: {
  loading: boolean;
  error: Error | null;
  onRetry: () => void;
  children: React.ReactNode;
}) {
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message={error.message} onRetry={onRetry} />;
  return <>{children}</>;
}
