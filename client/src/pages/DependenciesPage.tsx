import { useState, useMemo } from "react";
import { GitBranch } from "lucide-react";
import { useCreateAnalysis, useAnalysis } from "../hooks/useDependencies";
import { useAssets } from "../hooks/useAssets";
import { useEnvironments } from "../hooks/usePortfolio";
import { StatusBadge } from "../components/StatusBadge";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorAlert } from "../components/ErrorAlert";
import styles from "../styles/pages.module.css";

function SearchSelect({
  options,
  value,
  onChange,
  placeholder,
  loading,
}: {
  options: { key: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  loading?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!search) return options;
    const q = search.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, search]);

  const selectedLabel = options.find((o) => o.key === value)?.label;

  return (
    <div style={{ position: "relative" }}>
      <input
        className={styles.formInput}
        placeholder={placeholder}
        value={open ? search : selectedLabel || ""}
        onChange={(e) => {
          setSearch(e.target.value);
          if (!open) setOpen(true);
          if (value) onChange("");
        }}
        onFocus={() => {
          setOpen(true);
          setSearch("");
        }}
        onBlur={() => {
          // Delay to allow click on option
          setTimeout(() => setOpen(false), 200);
        }}
      />
      {loading && (
        <span
          style={{
            position: "absolute",
            right: 10,
            top: 10,
            fontSize: 12,
            color: "var(--color-text-secondary)",
          }}
        >
          Loading...
        </span>
      )}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            maxHeight: 200,
            overflow: "auto",
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "0 0 6px 6px",
            zIndex: 10,
            boxShadow: "var(--shadow-md)",
          }}
        >
          {filtered.length === 0 && (
            <div
              style={{
                padding: "8px 12px",
                fontSize: 13,
                color: "var(--color-text-secondary)",
              }}
            >
              No matches
            </div>
          )}
          {filtered.slice(0, 50).map((o) => (
            <div
              key={o.key}
              style={{
                padding: "6px 12px",
                fontSize: 13,
                cursor: "pointer",
                background: o.key === value ? "#f1f5f9" : undefined,
              }}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onChange(o.key);
                setSearch("");
                setOpen(false);
              }}
            >
              {o.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function DependenciesPage() {
  const [assetKey, setAssetKey] = useState("");
  const [revision, setRevision] = useState("");
  const [targetEnv, setTargetEnv] = useState("");
  const [analysisKey, setAnalysisKey] = useState<string | null>(null);
  const createAnalysis = useCreateAnalysis();
  const analysis = useAnalysis(analysisKey);

  const assets = useAssets();
  const envs = useEnvironments();

  const assetOptions = useMemo(
    () =>
      (assets.data ?? []).map((a) => ({
        key: String(a.assetKey),
        label: `${a.name || a.assetKey} (${a.assetType || "?"})`,
        revision: a.revision,
      })),
    [assets.data],
  );

  // Auto-fill revision when asset is selected
  function handleAssetChange(key: string) {
    setAssetKey(key);
    const match = assetOptions.find((a) => a.key === key);
    if (match?.revision != null) {
      setRevision(String(match.revision));
    }
  }

  const envOptions = useMemo(
    () =>
      (envs.data ?? []).map((e) => ({
        key: e.key,
        label: e.name || e.key,
      })),
    [envs.data],
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!assetKey || !targetEnv || !revision) return;

    createAnalysis.mutate(
      { assetKey, environmentKey: targetEnv, revision: parseInt(revision, 10) },
      {
        onSuccess: (data) => {
          const result = data as Record<string, unknown>;
          const key = result.analysisKey || result.key;
          if (key) setAnalysisKey(String(key));
        },
      },
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.headerTitle}>Dependencies</h1>
          <p className={styles.headerSubtitle}>
            Analyze deployment impact and asset dependencies
          </p>
        </div>
      </div>

      <div className={styles.settingsForm}>
        <h3 style={{ fontSize: 16, fontWeight: 600 }}>
          <GitBranch
            size={16}
            style={{ verticalAlign: "middle", marginRight: 6 }}
          />
          New Deployment Analysis
        </h3>
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 12 }}
        >
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Asset</label>
            <SearchSelect
              options={assetOptions}
              value={assetKey}
              onChange={handleAssetChange}
              placeholder="Search for an asset..."
              loading={assets.isLoading}
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Revision</label>
            <input
              className={styles.formInput}
              type="number"
              min="1"
              value={revision}
              onChange={(e) => setRevision(e.target.value)}
              placeholder="Revision number"
              required
              style={{ maxWidth: 150 }}
            />
            <span style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 2 }}>
              Auto-filled with the latest revision
            </span>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Target Environment</label>
            <SearchSelect
              options={envOptions}
              value={targetEnv}
              onChange={setTargetEnv}
              placeholder="Search for an environment..."
              loading={envs.isLoading}
            />
          </div>
          <button
            type="submit"
            className={`${styles.btn} ${styles.btnPrimary}`}
            disabled={createAnalysis.isPending || !assetKey || !targetEnv || !revision}
          >
            {createAnalysis.isPending ? "Analyzing..." : "Run Analysis"}
          </button>
          {createAnalysis.error && (
            <ErrorAlert message={createAnalysis.error.message} />
          )}
        </form>
      </div>

      {analysisKey && (
        <div
          className={styles.settingsForm}
          style={{ maxWidth: "100%" }}
        >
          <h3 style={{ fontSize: 16, fontWeight: 600 }}>
            Analysis Results
          </h3>
          {analysis.isLoading && <LoadingSpinner message="Analyzing..." />}
          {analysis.error && (
            <ErrorAlert message={analysis.error.message} />
          )}
          {analysis.data && (
            <div>
              <div style={{ marginBottom: 12 }}>
                <strong>Status: </strong>
                <StatusBadge status={String(analysis.data.processStatus)} />
              </div>
              {analysis.data.error ? (
                <ErrorAlert message={String((analysis.data.error as Record<string, unknown>).detail || (analysis.data.error as Record<string, unknown>).title)} />
              ) : null}
              <pre
                style={{
                  background: "var(--color-bg)",
                  padding: 16,
                  borderRadius: "var(--radius)",
                  fontSize: 13,
                  overflow: "auto",
                  maxHeight: 400,
                }}
              >
                {JSON.stringify(analysis.data.report ?? analysis.data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
