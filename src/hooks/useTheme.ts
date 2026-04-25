import { useEffect, useState } from "react";

const STORAGE_KEY = "interview-theme";

export const useTheme = () => {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "dark";
    const saved = localStorage.getItem(STORAGE_KEY) as "light" | "dark" | null;
    if (saved) return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "dark";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  return { theme, toggle: () => setTheme(theme === "dark" ? "light" : "dark") };
};
