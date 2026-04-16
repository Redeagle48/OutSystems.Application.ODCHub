import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, Plug, Info } from "lucide-react";
import { apiClient } from "../api/client";
import { useSettingsStatus } from "../hooks/useSettingsStatus";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorAlert } from "../components/ErrorAlert";
import styles from "../styles/pages.module.css";

function useSaveSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      portalDomain: string;
      clientId: string;
      clientSecret: string;
    }) =>
      apiClient<{ success: boolean; message: string }>("/settings", {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings"] }),
  });
}

function useTestConnection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiClient<{ success: boolean; message: string }>("/settings/test", {
        method: "POST",
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings"] }),
  });
}

export function SettingsPage() {
  const { data, isLoading, error, refetch } = useSettingsStatus();
  const saveSettings = useSaveSettings();
  const testConn = useTestConnection();

  const [portalDomain, setPortalDomain] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [loaded, setLoaded] = useState(false);

  // Populate form from server state on first load
  useEffect(() => {
    if (data && !loaded) {
      setPortalDomain(data.portalDomain || "");
      setClientId(data.clientId || "");
      // Don't populate secret — it's never sent back
      setLoaded(true);
    }
  }, [data, loaded]);

  if (isLoading) return <LoadingSpinner message="Loading settings..." />;
  if (error)
    return <ErrorAlert message={error.message} onRetry={() => refetch()} />;

  const expiresIn = data?.tokenExpiresAt
    ? Math.max(0, Math.round((data.tokenExpiresAt - Date.now()) / 60000))
    : null;

  const expiresAtLabel = data?.tokenExpiresAt
    ? new Date(data.tokenExpiresAt).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : null;

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    saveSettings.mutate({ portalDomain, clientId, clientSecret });
  }

  const hasChanges =
    portalDomain !== (data?.portalDomain || "") ||
    clientId !== (data?.clientId || "") ||
    clientSecret !== "";

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.headerTitle}>Settings</h1>
          <p className={styles.headerSubtitle}>
            Configure your ODC portal connection
          </p>
        </div>
      </div>

      {data && !data.connected && (
        <div
          role="alert"
          style={{
            display: "flex",
            gap: 12,
            padding: "12px 16px",
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
            borderRadius: 8,
            color: "#1e40af",
            fontSize: 14,
            alignItems: "flex-start",
          }}
        >
          <Info size={18} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontWeight: 600, marginBottom: 2 }}>
              {data.configured
                ? "Portal connection unavailable"
                : "Portal connection required"}
            </div>
            <div>
              {data.configured
                ? "We couldn't reach your ODC portal with the saved credentials. Verify the values below and use Test Connection to continue."
                : "The rest of the app is disabled until you configure a valid ODC portal connection. Fill in the credentials below to get started."}
            </div>
          </div>
        </div>
      )}

      {/* Connection status */}
      <div className={styles.settingsForm}>
        <h3 style={{ fontSize: 16, fontWeight: 600 }}>Connection Status</h3>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontSize: 14,
          }}
        >
          <span
            className={`${styles.statusDot} ${data?.connected ? styles.statusConnected : styles.statusDisconnected}`}
          />
          <span>
            {!data?.configured
              ? "Not configured"
              : data.connected
                ? "Connected"
                : "Disconnected"}
          </span>
          {data?.connected && data.portalDomain && (
            <span style={{ color: "var(--color-text-secondary)" }}>
              ({data.portalDomain})
            </span>
          )}
          {data?.connected && expiresIn !== null && expiresIn > 0 && (
            <span
              style={{
                marginLeft: "auto",
                fontSize: 13,
                color: "var(--color-text-secondary)",
                textAlign: "right",
              }}
              title={expiresAtLabel ?? undefined}
            >
              Token expires in {Math.floor(expiresIn / 60)}h {expiresIn % 60}m
              {expiresAtLabel && (
                <>
                  <br />
                  <span style={{ fontSize: 12 }}>on {expiresAtLabel}</span>
                </>
              )}
            </span>
          )}
        </div>
      </div>

      {/* Credentials form */}
      <form className={styles.settingsForm} onSubmit={handleSave}>
        <h3 style={{ fontSize: 16, fontWeight: 600 }}>ODC Credentials</h3>

        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor="portalDomain">
            Portal Domain
          </label>
          <input
            id="portalDomain"
            className={styles.formInput}
            placeholder="myorg.outsystems.dev"
            value={portalDomain}
            onChange={(e) => setPortalDomain(e.target.value)}
            required
          />
          <span
            style={{
              fontSize: 12,
              color: "var(--color-text-secondary)",
              marginTop: 2,
            }}
          >
            Your ODC portal domain (without https://)
          </span>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor="clientId">
            Client ID
          </label>
          <input
            id="clientId"
            className={styles.formInput}
            placeholder="API client ID from ODC Portal"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor="clientSecret">
            Client Secret
          </label>
          <input
            id="clientSecret"
            type="password"
            className={styles.formInput}
            placeholder={data?.hasSecret ? "(unchanged — enter new value to update)" : "API client secret"}
            value={clientSecret}
            onChange={(e) => setClientSecret(e.target.value)}
            required={!data?.hasSecret}
          />
          {data?.hasSecret && (
            <span
              style={{
                fontSize: 12,
                color: "var(--color-text-secondary)",
                marginTop: 2,
              }}
            >
              Leave blank to keep the current secret
            </span>
          )}
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button
            type="submit"
            className={`${styles.btn} ${styles.btnPrimary}`}
            disabled={saveSettings.isPending || (!hasChanges && !clientSecret)}
          >
            <Save size={14} />
            {saveSettings.isPending ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnSecondary}`}
            onClick={() => testConn.mutate()}
            disabled={testConn.isPending || !data?.configured}
          >
            <Plug size={14} />
            {testConn.isPending ? "Testing..." : "Test Connection"}
          </button>
        </div>

        {saveSettings.isSuccess && (
          <div
            style={{
              padding: "8px 12px",
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: 6,
              color: "#166534",
              fontSize: 14,
            }}
          >
            {saveSettings.data.message}
          </div>
        )}
        {saveSettings.isError && (
          <ErrorAlert message={saveSettings.error.message} />
        )}

        {testConn.isSuccess && (
          <div
            style={{
              padding: "8px 12px",
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: 6,
              color: "#166534",
              fontSize: 14,
            }}
          >
            {testConn.data.message}
          </div>
        )}
        {testConn.isError && (
          <ErrorAlert message={testConn.error.message} />
        )}
      </form>
    </div>
  );
}
