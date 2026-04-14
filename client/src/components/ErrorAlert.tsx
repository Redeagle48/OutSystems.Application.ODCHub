import { AlertTriangle } from "lucide-react";

interface ErrorAlertProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorAlert({ message, onRetry }: ErrorAlertProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 16px",
        background: "#fef2f2",
        border: "1px solid #fecaca",
        borderRadius: "var(--radius)",
        color: "#991b1b",
        fontSize: 14,
      }}
    >
      <AlertTriangle size={18} />
      <span style={{ flex: 1 }}>{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            padding: "4px 12px",
            border: "1px solid #fecaca",
            borderRadius: 6,
            background: "#fff",
            color: "#991b1b",
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          Retry
        </button>
      )}
    </div>
  );
}
