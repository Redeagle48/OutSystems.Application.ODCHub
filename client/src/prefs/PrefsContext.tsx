import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type Density = "compact" | "cozy" | "comfortable";
export type SidebarTheme = "dark" | "light";
export type Accent = "crimson" | "navy" | "teal" | "amber" | "violet";
export type RevisionView = "table" | "list";

export interface Prefs {
  density: Density;
  sidebar: SidebarTheme;
  accent: Accent;
  revisionView: RevisionView;
  showFilters: boolean;
  showSummary: boolean;
}

const DEFAULTS: Prefs = {
  density: "cozy",
  sidebar: "dark",
  accent: "crimson",
  revisionView: "table",
  showFilters: true,
  showSummary: true,
};

const STORAGE_KEY = "odc-hub.prefs";

interface PrefsCtx extends Prefs {
  set: <K extends keyof Prefs>(key: K, value: Prefs[K]) => void;
  reset: () => void;
}

const PrefsContext = createContext<PrefsCtx | null>(null);

function loadInitial(): Prefs {
  const seeded = (window as unknown as { __TWEAKS__?: Partial<Prefs> })
    .__TWEAKS__;
  let stored: Partial<Prefs> | null = null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) stored = JSON.parse(raw);
  } catch {
    stored = null;
  }
  return { ...DEFAULTS, ...seeded, ...stored };
}

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Prefs>(loadInitial);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // Ignore quota / disabled storage.
    }
  }, [prefs]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.density = prefs.density;
    root.dataset.sidebar = prefs.sidebar;
    root.dataset.accent = prefs.accent;
  }, [prefs.density, prefs.sidebar, prefs.accent]);

  const value: PrefsCtx = {
    ...prefs,
    set: (key, value) => setPrefs((p) => ({ ...p, [key]: value })),
    reset: () => setPrefs(DEFAULTS),
  };

  return (
    <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>
  );
}

export function usePrefs(): PrefsCtx {
  const ctx = useContext(PrefsContext);
  if (!ctx) throw new Error("usePrefs must be used within PrefsProvider");
  return ctx;
}
