import { useState } from "react";
import { Settings2, X } from "lucide-react";
import {
  usePrefs,
  type Accent,
  type Density,
  type RevisionView,
  type SidebarTheme,
} from "../prefs/PrefsContext";
import styles from "../styles/tweaks.module.css";

const ACCENT_SWATCHES: { value: Accent; color: string }[] = [
  { value: "crimson", color: "#c8392f" },
  { value: "navy", color: "#2d5ecf" },
  { value: "teal", color: "#0f766e" },
  { value: "amber", color: "#c2410c" },
  { value: "violet", color: "#7c3aed" },
];

const DENSITIES: Density[] = ["compact", "cozy", "comfortable"];
const SIDEBARS: SidebarTheme[] = ["dark", "light"];
const REVISION_VIEWS: RevisionView[] = ["table", "list"];

export function TweaksPanel() {
  const prefs = usePrefs();
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        className={styles.launcher}
        onClick={() => setOpen(true)}
        aria-label="Open appearance tweaks"
      >
        <Settings2 size={14} />
        Tweaks
      </button>
    );
  }

  return (
    <aside className={styles.panel} aria-label="Appearance tweaks">
      <header className={styles.header}>
        <h4 className={styles.title}>Tweaks</h4>
        <button
          type="button"
          className={styles.iconBtn}
          onClick={() => setOpen(false)}
          aria-label="Close tweaks"
        >
          <X size={14} />
        </button>
      </header>

      <div className={styles.body}>
        <label className={styles.field}>
          Density
          <div className={styles.seg}>
            {DENSITIES.map((d) => (
              <button
                key={d}
                type="button"
                aria-pressed={prefs.density === d}
                onClick={() => prefs.set("density", d)}
              >
                {d}
              </button>
            ))}
          </div>
        </label>

        <label className={styles.field}>
          Sidebar
          <div className={styles.seg}>
            {SIDEBARS.map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={prefs.sidebar === s}
                onClick={() => prefs.set("sidebar", s)}
              >
                {s}
              </button>
            ))}
          </div>
        </label>

        <label className={styles.field}>
          Accent
          <div className={styles.swatches}>
            {ACCENT_SWATCHES.map(({ value, color }) => (
              <button
                key={value}
                type="button"
                aria-pressed={prefs.accent === value}
                aria-label={value}
                onClick={() => prefs.set("accent", value)}
                style={{ background: color }}
              />
            ))}
          </div>
        </label>

        <label className={styles.field}>
          Revision view
          <div className={styles.seg}>
            {REVISION_VIEWS.map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={prefs.revisionView === v}
                onClick={() => prefs.set("revisionView", v)}
              >
                {v}
              </button>
            ))}
          </div>
        </label>

        <div className={styles.toggleRow}>
          Show filters
          <button
            type="button"
            role="switch"
            aria-checked={prefs.showFilters}
            className={`${styles.switch} ${prefs.showFilters ? styles.switchOn : ""}`}
            onClick={() => prefs.set("showFilters", !prefs.showFilters)}
          />
        </div>

        <div className={styles.toggleRow}>
          Show summary
          <button
            type="button"
            role="switch"
            aria-checked={prefs.showSummary}
            className={`${styles.switch} ${prefs.showSummary ? styles.switchOn : ""}`}
            onClick={() => prefs.set("showSummary", !prefs.showSummary)}
          />
        </div>
      </div>
    </aside>
  );
}
