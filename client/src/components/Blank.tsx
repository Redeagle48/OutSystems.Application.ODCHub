import styles from "../styles/assetDetail.module.css";

export function Blank({ reason = "Not set" }: { reason?: string }) {
  return <span className={styles.blank} title={reason}>{reason}</span>;
}

import { initials, hueFrom } from "../utils/format";

export function Author({ name }: { name: string | null | undefined }) {
  if (!name) return <Blank reason="Unknown" />;
  const hue = hueFrom(name);
  return (
    <span className={styles.authorCell}>
      <span
        className={styles.avatar}
        style={{ background: `oklch(70% 0.09 ${hue})` }}
        aria-hidden
      >
        {initials(name)}
      </span>
      <span className={styles.authorName}>{name}</span>
    </span>
  );
}
