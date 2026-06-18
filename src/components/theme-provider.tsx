"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";
export type AccentColor = "blue" | "purple" | "green" | "orange" | "red" | "pink" | "indigo" | "yellow";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  accentColor: AccentColor;
  setAccentColor: (accent: AccentColor) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [accentColor, setAccentColorState] = useState<AccentColor>("blue");

  useEffect(() => {
    // 1. Initial load from localStorage
    const savedTheme = localStorage.getItem("theme") as Theme | null;
    if (savedTheme) {
      setThemeState(savedTheme);
      applyThemeClass(savedTheme);
    } else {
      applyThemeClass("system");
    }

    const savedAccent = localStorage.getItem("accent-color") as AccentColor | null;
    if (savedAccent) {
      setAccentColorState(savedAccent);
      applyAccentClass(savedAccent);
    } else {
      applyAccentClass("blue");
    }

    // 2. Listen to storage changes (from other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "theme") {
        const newTheme = (e.newValue || "system") as Theme;
        setThemeState(newTheme);
        applyThemeClass(newTheme);
      }
      if (e.key === "accent-color") {
        const newAccent = (e.newValue || "blue") as AccentColor;
        setAccentColorState(newAccent);
        applyAccentClass(newAccent);
      }
    };

    // 3. Listen to system prefers-color-scheme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemThemeChange = () => {
      const currentTheme = localStorage.getItem("theme") as Theme | null;
      if (!currentTheme || currentTheme === "system") {
        applyThemeClass("system");
      }
    };

    window.addEventListener("storage", handleStorageChange);
    mediaQuery.addEventListener("change", handleSystemThemeChange);

    // 4. Custom event for same-tab changes to ensure immediate sync
    const handleLocalThemeChange = () => {
      const currentTheme = (localStorage.getItem("theme") || "system") as Theme;
      setThemeState(currentTheme);
      applyThemeClass(currentTheme);

      const currentAccent = (localStorage.getItem("accent-color") || "blue") as AccentColor;
      setAccentColorState(currentAccent);
      applyAccentClass(currentAccent);
    };
    window.addEventListener("local-theme-change", handleLocalThemeChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
      window.removeEventListener("local-theme-change", handleLocalThemeChange);
    };
  }, []);

  const setTheme = (newTheme: Theme) => {
    localStorage.setItem("theme", newTheme);
    setThemeState(newTheme);
    applyThemeClass(newTheme);
    window.dispatchEvent(new Event("local-theme-change"));
  };

  const setAccentColor = (newAccent: AccentColor) => {
    localStorage.setItem("accent-color", newAccent);
    setAccentColorState(newAccent);
    applyAccentClass(newAccent);
    window.dispatchEvent(new Event("local-theme-change"));
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, accentColor, setAccentColor }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

function applyThemeClass(t: Theme) {
  if (typeof window === "undefined") return;
  const root = window.document.documentElement;
  root.classList.remove("light", "dark");
  
  if (t === "dark") {
    root.classList.add("dark");
  } else if (t === "light") {
    root.classList.add("light");
  } else {
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.classList.add(isDark ? "dark" : "light");
  }
}

function applyAccentClass(c: AccentColor) {
  if (typeof window === "undefined") return;
  const root = window.document.documentElement;
  root.setAttribute("data-accent", c);
}
