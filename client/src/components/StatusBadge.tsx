type Tone = "success" | "info" | "warn" | "error" | "muted";

const tonePalette: Record<Tone, { bg: string; ink: string }> = {
  success: { bg: "#e7f3ec", ink: "#1f7a4c" },
  info: { bg: "#e5ecfb", ink: "#2d5ecf" },
  warn: { bg: "#faf0da", ink: "#a06a00" },
  error: { bg: "#fbe9e6", ink: "#8f1f17" },
  muted: { bg: "#f1efe9", ink: "#6b7280" },
};

const toneMap: Record<string, Tone> = {
  success: "success",
  completed: "success",
  finished: "success",
  resolved: "success",
  closed: "success",
  open: "info",
  running: "info",
  in_progress: "info",
  pending: "warn",
  queued: "warn",
  warning: "warn",
  snoozed: "warn",
  medium: "warn",
  low: "muted",
  dismissed: "muted",
  high: "error",
  failed: "error",
  error: "error",
  finishedwitherrors: "error",
  finishedwitherror: "error",
  critical: "error",
};

export function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase().replace(/\s+/g, "_");
  const tone = toneMap[normalized] ?? "muted";
  const { bg, ink } = tonePalette[tone];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "2px 10px",
        borderRadius: 999,
        fontSize: 11.5,
        fontWeight: 600,
        background: bg,
        color: ink,
        lineHeight: 1.6,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: ink,
        }}
      />
      {status}
    </span>
  );
}
