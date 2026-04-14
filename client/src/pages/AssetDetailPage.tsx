import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
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
import styles from "../styles/pages.module.css";

function fmtDate(d: string | null | undefined) {
  if (!d) return "-";
  return new Date(d).toLocaleString();
}

type Tab = "revisions" | "builds" | "deployments" | "dependencies" | "quality";

const revisionCols: Column<AssetRevision & Record<string, unknown>>[] = [
  { key: "revision", label: "Rev" },
  {
    key: "tag",
    label: "Tag",
    render: (r) =>
      r.tag ? (
        String(r.tag)
      ) : (
        <span style={{ color: "var(--color-text-secondary)", fontStyle: "italic" }}>
          —
        </span>
      ),
  },
  {
    key: "createdAt",
    label: "Created",
    render: (r) => fmtDate(r.createdAt || r.revisionDateTime),
  },
  {
    key: "commitMessage",
    label: "Commit Message",
    render: (r) => String(r.commitMessage ?? "—"),
  },
  {
    key: "createdBy",
    label: "By",
    render: (r) => String(r.createdBy ?? "—"),
  },
];

const buildCols: Column<Build & Record<string, unknown>>[] = [
  {
    key: "status",
    label: "Status",
    render: (r) => <StatusBadge status={r.status} />,
  },
  { key: "buildType", label: "Type" },
  { key: "assetRevision", label: "Revision" },
  {
    key: "startedDateTime",
    label: "Started",
    render: (r) => fmtDate(r.startedDateTime),
  },
  {
    key: "finishedDateTime",
    label: "Finished",
    render: (r) => fmtDate(r.finishedDateTime),
  },
];

const deployCols: Column<DeploymentOp & Record<string, unknown>>[] = [
  {
    key: "status",
    label: "Status",
    render: (r) => <StatusBadge status={r.status} />,
  },
  { key: "operation", label: "Operation" },
  {
    key: "revisions",
    label: "Revisions",
    render: (r) => (r.revisions ? r.revisions.join(", ") : "—"),
  },
  {
    key: "startedDateTime",
    label: "Started",
    render: (r) => fmtDate(r.startedDateTime),
  },
  {
    key: "finishedDateTime",
    label: "Finished",
    render: (r) => fmtDate(r.finishedDateTime),
  },
  {
    key: "deployedBy",
    label: "By",
    render: (r) => String(r.deployedBy ?? "—"),
  },
];

const depCols: Column<AssetDependency & Record<string, unknown>>[] = [
  {
    key: "name",
    label: "Name",
    render: (r) => String(r.name ?? r.key),
  },
  {
    key: "type",
    label: "Type",
    render: (r) => String(r.type ?? "—"),
  },
  { key: "revision", label: "Revision" },
  {
    key: "isDirectProducer",
    label: "Direct",
    render: (r) =>
      r.isDirectProducer != null ? (r.isDirectProducer ? "Yes" : "No") : "—",
  },
];

const findingCols: Column<Record<string, unknown>>[] = [
  {
    key: "elementName",
    label: "Element",
    render: (r) => String(r.elementName || r.patternId || "—"),
  },
  {
    key: "elementType",
    label: "Type",
    render: (r) => String(r.elementType ?? "—"),
  },
  {
    key: "severity",
    label: "Severity",
    render: (r) =>
      r.severity ? <StatusBadge status={String(r.severity)} /> : "—",
  },
  {
    key: "status",
    label: "Status",
    render: (r) =>
      r.status ? <StatusBadge status={String(r.status)} /> : "—",
  },
  {
    key: "discoveredOn",
    label: "Discovered",
    render: (r) =>
      r.discoveredOn
        ? new Date(String(r.discoveredOn)).toLocaleDateString()
        : "—",
  },
];

export function AssetDetailPage() {
  const { assetKey } = useParams<{ assetKey: string }>();
  const [tab, setTab] = useState<Tab>("revisions");
  const [buildRevision, setBuildRevision] = useState<number | null>(null);

  const detail = useAssetDetail(assetKey ?? null);
  const revisions = useAssetRevisions(assetKey ?? null);

  // Default build revision to the latest once loaded
  const effectiveRev = buildRevision ?? detail.data?.revision ?? null;
  const builds = useAssetBuilds(assetKey ?? null, effectiveRev);
  const deployments = useAssetDeployments(assetKey ?? null);
  const consumers = useAssetConsumers(assetKey ?? null);
  const producers = useAssetProducers(
    assetKey ?? null,
    detail.data?.revision ?? null,
  );
  const findings = useAssetFindings(assetKey ?? null);

  if (detail.isLoading) return <LoadingSpinner message="Loading asset..." />;
  if (detail.error)
    return (
      <ErrorAlert
        message={detail.error.message}
        onRetry={() => detail.refetch()}
      />
    );

  const asset = detail.data;
  if (!asset) return null;

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "revisions", label: "Revisions", count: revisions.data?.length },
    { key: "builds", label: "Builds", count: builds.data?.length },
    { key: "deployments", label: "Deployments", count: deployments.data?.length },
    {
      key: "dependencies",
      label: "Dependencies",
      count:
        (producers.data?.length ?? 0) + (consumers.data?.length ?? 0) || undefined,
    },
    { key: "quality", label: "Code Quality", count: findings.data?.length },
  ];

  return (
    <div className={styles.page}>
      {/* Header */}
      <div>
        <Link
          to="/assets"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            fontSize: 13,
            color: "var(--color-text-secondary)",
            textDecoration: "none",
            marginBottom: 8,
          }}
        >
          <ArrowLeft size={14} /> Back to Assets
        </Link>
        <div className={styles.header}>
          <div>
            <h1 className={styles.headerTitle}>{asset.name}</h1>
            <p className={styles.headerSubtitle}>
              {asset.assetType} &middot; Revision {asset.revision}
              {asset.tag ? ` (${asset.tag})` : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Info cards */}
      <div className={styles.cardGrid}>
        <div className={styles.card}>
          <div className={styles.cardMeta}>Description</div>
          <div style={{ fontSize: 14, marginTop: 4 }}>
            {asset.description || "No description"}
          </div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardMeta}>Details</div>
          <div style={{ fontSize: 13, marginTop: 4, display: "flex", flexDirection: "column", gap: 4 }}>
            <div>
              <strong>Created:</strong> {fmtDate(asset.createdAt)}
            </div>
            <div>
              <strong>External:</strong> {asset.isExternal ? "Yes" : "No"}
            </div>
            {asset.commitMessage && (
              <div>
                <strong>Commit:</strong> {asset.commitMessage}
              </div>
            )}
          </div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardMeta}>Version</div>
          <div style={{ fontSize: 13, marginTop: 4, display: "flex", flexDirection: "column", gap: 4 }}>
            <div>
              <strong>Revision:</strong> {asset.revision}
            </div>
            <div>
              <strong>Tag:</strong> {asset.tag ?? "Not tagged"}
            </div>
            {asset.taggedAt && (
              <div>
                <strong>Tagged:</strong> {fmtDate(asset.taggedAt)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.toolbar} style={{ borderBottom: "1px solid var(--color-border)", paddingBottom: 0 }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            className={styles.btn}
            style={{
              borderBottom: tab === t.key ? "2px solid var(--color-primary)" : "2px solid transparent",
              borderRadius: 0,
              color: tab === t.key ? "var(--color-primary)" : "var(--color-text-secondary)",
              background: "transparent",
              fontWeight: tab === t.key ? 600 : 400,
            }}
            onClick={() => setTab(t.key)}
          >
            {t.label}
            {t.count != null && (
              <span
                style={{
                  marginLeft: 4,
                  fontSize: 11,
                  background: "var(--color-bg)",
                  padding: "1px 6px",
                  borderRadius: 10,
                }}
              >
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "revisions" && (
        <TabSection loading={revisions.isLoading} error={revisions.error} onRetry={() => revisions.refetch()}>
          {revisions.data && (
            <DataTable
              data={revisions.data as (AssetRevision & Record<string, unknown>)[]}
              columns={revisionCols}
              keyField="revision"
              emptyMessage="No revisions found"
            />
          )}
        </TabSection>
      )}

      {tab === "builds" && (
        <>
          {revisions.data && revisions.data.length > 1 && (
            <div className={styles.toolbar}>
              <label style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>Revision:</label>
              <select
                className={styles.select}
                value={effectiveRev ?? ""}
                onChange={(e) => setBuildRevision(Number(e.target.value))}
              >
                {revisions.data.map((r) => (
                  <option key={r.revision} value={r.revision}>
                    Rev {r.revision}{r.tag ? ` (${r.tag})` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}
          <TabSection loading={builds.isLoading} error={builds.error} onRetry={() => builds.refetch()}>
            {builds.data && (
              <DataTable
                data={builds.data as (Build & Record<string, unknown>)[]}
                columns={buildCols}
                keyField="buildKey"
                emptyMessage="No builds for this revision"
              />
            )}
          </TabSection>
        </>
      )}

      {tab === "deployments" && (
        <TabSection loading={deployments.isLoading} error={deployments.error} onRetry={() => deployments.refetch()}>
          {deployments.data && (
            <DataTable
              data={deployments.data as (DeploymentOp & Record<string, unknown>)[]}
              columns={deployCols}
              keyField="key"
              emptyMessage="No deployment operations found"
            />
          )}
        </TabSection>
      )}

      {tab === "dependencies" && (
        <>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginTop: 4 }}>
            Producers (dependencies this asset uses)
          </h3>
          <TabSection loading={producers.isLoading} error={producers.error} onRetry={() => producers.refetch()}>
            {producers.data && (
              <DataTable
                data={producers.data as (AssetDependency & Record<string, unknown>)[]}
                columns={depCols}
                keyField="key"
                emptyMessage="No producers found"
              />
            )}
          </TabSection>

          <h3 style={{ fontSize: 15, fontWeight: 600, marginTop: 16 }}>
            Consumers (assets that depend on this)
          </h3>
          <TabSection loading={consumers.isLoading} error={consumers.error} onRetry={() => consumers.refetch()}>
            {consumers.data && (
              <DataTable
                data={consumers.data as (AssetDependency & Record<string, unknown>)[]}
                columns={depCols}
                keyField="key"
                emptyMessage="No consumers found"
              />
            )}
          </TabSection>
        </>
      )}

      {tab === "quality" && (
        <TabSection loading={findings.isLoading} error={findings.error} onRetry={() => findings.refetch()}>
          {findings.data && (
            <DataTable
              data={findings.data}
              columns={findingCols}
              keyField="id"
              emptyMessage="No code quality findings"
            />
          )}
        </TabSection>
      )}
    </div>
  );
}

function TabSection({
  loading,
  error,
  onRetry,
  children,
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
