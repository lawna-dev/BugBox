import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "light" | "dark";
const KEY = "bugbox.theme";

const ThemeContext = createContext<{ theme: Theme; toggle: () => void; set: (t: Theme) => void } | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    const saved = (typeof window !== "undefined" && window.localStorage.getItem(KEY)) as Theme | null;
    const prefersDark = typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    const initial: Theme = saved ?? (prefersDark ? "dark" : "light");
    setThemeState(initial);
    apply(initial);
  }, []);

  function apply(t: Theme) {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("dark", t === "dark");
  }
  function set(t: Theme) {
    setThemeState(t);
    apply(t);
    if (typeof window !== "undefined") window.localStorage.setItem(KEY, t);
  }
  function toggle() { set(theme === "dark" ? "light" : "dark"); }

  return <ThemeContext.Provider value={{ theme, toggle, set }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
