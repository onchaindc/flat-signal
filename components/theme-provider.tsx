"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

type Theme = "dark" | "light";

const ThemeContext = createContext<{
  theme: Theme;
  toggle: () => void;
}>({
  theme: "dark",
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("flat-signal-theme") as Theme | null;
    const preferred =
      stored ||
      (window.matchMedia("(prefers-color-scheme: light)").matches
        ? "light"
        : "dark");
    setTheme(preferred);
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(preferred);
    setReady(true);
  }, []);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem("flat-signal-theme", next);
      document.documentElement.classList.remove("light", "dark");
      document.documentElement.classList.add(next);
      return next;
    });
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen" style={{ background: "#09090b" }} />
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
