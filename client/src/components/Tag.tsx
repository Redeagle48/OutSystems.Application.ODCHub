export function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 10px",
        borderRadius: 999,
        fontSize: 11.5,
        fontWeight: 500,
        background: "var(--color-chip)",
        color: "var(--color-text)",
        border: "1px solid var(--color-border)",
      }}
    >
      {children}
    </span>
  );
}
