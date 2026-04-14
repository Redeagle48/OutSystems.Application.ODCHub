const colorMap: Record<string, string> = {
  success: "#16a34a",
  completed: "#16a34a",
  finished: "#16a34a",
  resolved: "#16a34a",
  closed: "#16a34a",
  open: "#2563eb",
  running: "#2563eb",
  in_progress: "#2563eb",
  pending: "#d97706",
  queued: "#d97706",
  warning: "#d97706",
  snoozed: "#d97706",
  medium: "#d97706",
  low: "#64748b",
  dismissed: "#64748b",
  high: "#ea580c",
  failed: "#dc2626",
  error: "#dc2626",
  finishedwitherrors: "#dc2626",
  finishedwitherror: "#dc2626",
  critical: "#dc2626",
};

export function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase().replace(/\s+/g, "_");
  const color = colorMap[normalized] || "#64748b";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "2px 10px",
        borderRadius: 12,
        fontSize: 12,
        fontWeight: 600,
        background: `${color}18`,
        color,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: color,
        }}
      />
      {status}
    </span>
  );
}
