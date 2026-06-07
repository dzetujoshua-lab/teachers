"use client";

import * as React from "react";

export type Theme = "light" | "dark" | "system";

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme | ((theme: Theme) => Theme)) => void;
}

const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined);

const themeStorageKey = "theme";

function getSystemTheme(): "light" | "dark" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  enableSystem?: boolean;
  attribute?: string;
  disableTransitionOnChange?: boolean;
}

function getInitialTheme(defaultTheme: Theme, enableSystem: boolean): Theme {
  if (typeof window === "undefined") {
    return defaultTheme === "system" && !enableSystem ? "light" : defaultTheme;
  }

  const storedTheme = window.localStorage.getItem(themeStorageKey);
  if (storedTheme === "dark" || storedTheme === "light" || storedTheme === "system") {
    return storedTheme;
  }

  return defaultTheme === "system" && !enableSystem ? "light" : defaultTheme;
}

function applyTheme(theme: Theme, enableSystem: boolean) {
  const root = document.documentElement;
  const resolvedTheme = theme === "system" && enableSystem ? getSystemTheme() : theme === "system" ? "light" : theme;

  if (resolvedTheme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }

  return resolvedTheme;
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  enableSystem = true,
}: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<Theme>(() => getInitialTheme(defaultTheme, enableSystem));
  const [resolvedTheme, setResolvedTheme] = React.useState<"light" | "dark">(() => {
    if (typeof window === "undefined") {
      return "light";
    }

    return theme === "system" && enableSystem ? getSystemTheme() : theme === "system" ? "light" : theme;
  });

  React.useEffect(() => {
    const nextResolvedTheme = applyTheme(theme, enableSystem);
    setResolvedTheme(nextResolvedTheme);

    if (!enableSystem) {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (event: MediaQueryListEvent) => {
      if (theme !== "system") {
        return;
      }

      const nextTheme = event.matches ? "dark" : "light";
      setResolvedTheme(nextTheme);
      if (nextTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    };

    mediaQuery.addEventListener("change", onChange);
    return () => mediaQuery.removeEventListener("change", onChange);
  }, [theme, enableSystem]);

  const setTheme = React.useCallback(
    (nextTheme: Theme | ((theme: Theme) => Theme)) => {
      setThemeState((currentTheme) => {
        const resolved = typeof nextTheme === "function" ? nextTheme(currentTheme) : nextTheme;
        window.localStorage.setItem(themeStorageKey, resolved);
        return resolved;
      });
    },
    []
  );

  const value = React.useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
