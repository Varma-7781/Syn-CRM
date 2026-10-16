/**
 * Global Theme Context & Provider
 * Synchronizes dark/light theme seamlessly across all routes (Login, Admin, Sales, Logout)
 * with instant local storage persistence, cross-tab reactivity,
 * and a cinematic circular reveal explosion animation originating from the toggle button (View Transitions API).
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { flushSync } from "react-dom";

export type Theme = "dark" | "light";

export interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggle: (event?: React.MouseEvent | MouseEvent | { clientX: number; clientY: number }) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

const STORAGE_KEY = "theme";

export function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark") {
      return saved;
    }
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches) {
      return "light";
    }
  } catch {}
  return "dark";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  const applyTheme = useCallback((newTheme: Theme) => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (newTheme === "light") {
      root.classList.add("light");
    } else {
      root.classList.remove("light");
    }
  }, []);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(STORAGE_KEY, newTheme);
    } catch {}
    applyTheme(newTheme);
  }, [applyTheme]);

  const toggle = useCallback((event?: React.MouseEvent | MouseEvent | { clientX: number; clientY: number }) => {
    const isAppearanceTransition =
      typeof document !== "undefined" &&
      // @ts-ignore
      typeof document.startViewTransition === "function" &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Resolve click coordinates (or center of toggle button)
    let x = typeof window !== "undefined" ? window.innerWidth / 2 : 0;
    let y = typeof window !== "undefined" ? window.innerHeight / 2 : 0;

    if (event && "clientX" in event && event.clientX > 0 && event.clientY > 0) {
      x = event.clientX;
      y = event.clientY;
    } else if (typeof document !== "undefined") {
      const btn = document.querySelector('button[aria-label="Toggle theme"]');
      if (btn) {
        const rect = btn.getBoundingClientRect();
        x = rect.left + rect.width / 2;
        y = rect.top + rect.height / 2;
      }
    }

    const endRadius = typeof window !== "undefined"
      ? Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))
      : 1200;

    const switchTheme = () => {
      setThemeState((prev) => {
        const next: Theme = prev === "dark" ? "light" : "dark";
        try {
          localStorage.setItem(STORAGE_KEY, next);
        } catch {}
        applyTheme(next);
        return next;
      });
    };

    if (!isAppearanceTransition) {
      switchTheme();
      return;
    }

    try {
      // @ts-ignore
      const transition = document.startViewTransition(() => {
        flushSync(() => {
          switchTheme();
        });
      });

      transition.ready
        .then(() => {
          const clipPath = [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ];
          document.documentElement.animate(
            {
              clipPath,
            },
            {
              duration: 620,
              easing: "cubic-bezier(0.16, 1, 0.3, 1)",
              pseudoElement: "::view-transition-new(root)",
            }
          );
        })
        .catch(() => {
          // Graceful fallback if transition promise rejects
        });
    } catch {
      switchTheme();
    }
  }, [applyTheme]);

  // Synchronize on mount and listen to cross-tab/window storage updates
  useEffect(() => {
    const current = getInitialTheme();
    setThemeState(current);
    applyTheme(current);

    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && (e.newValue === "light" || e.newValue === "dark")) {
        setThemeState(e.newValue);
        applyTheme(e.newValue);
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [applyTheme]);

  const value = useMemo(() => ({ theme, setTheme, toggle }), [theme, setTheme, toggle]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    // Fallback if accessed outside provider
    const currentTheme: Theme =
      typeof document !== "undefined" && document.documentElement.classList.contains("light")
        ? "light"
        : "dark";

    return {
      theme: currentTheme,
      setTheme: (t: Theme) => {
        if (typeof document !== "undefined") {
          document.documentElement.classList.toggle("light", t === "light");
          localStorage.setItem(STORAGE_KEY, t);
        }
      },
      toggle: (event?: React.MouseEvent | MouseEvent | { clientX: number; clientY: number }) => {
        if (typeof document === "undefined") return;
        const isAppearanceTransition =
          // @ts-ignore
          typeof document.startViewTransition === "function" &&
          !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        let x = window.innerWidth / 2;
        let y = window.innerHeight / 2;

        if (event && "clientX" in event && event.clientX > 0 && event.clientY > 0) {
          x = event.clientX;
          y = event.clientY;
        } else {
          const btn = document.querySelector('button[aria-label="Toggle theme"]');
          if (btn) {
            const rect = btn.getBoundingClientRect();
            x = rect.left + rect.width / 2;
            y = rect.top + rect.height / 2;
          }
        }

        const endRadius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
        const next: Theme = document.documentElement.classList.contains("light") ? "dark" : "light";

        const switchTheme = () => {
          document.documentElement.classList.toggle("light", next === "light");
          localStorage.setItem(STORAGE_KEY, next);
        };

        if (!isAppearanceTransition) {
          switchTheme();
          return;
        }

        try {
          // @ts-ignore
          const transition = document.startViewTransition(() => {
            switchTheme();
          });
          transition.ready.then(() => {
            document.documentElement.animate(
              {
                clipPath: [
                  `circle(0px at ${x}px ${y}px)`,
                  `circle(${endRadius}px at ${x}px ${y}px)`,
                ],
              },
              {
                duration: 620,
                easing: "cubic-bezier(0.16, 1, 0.3, 1)",
                pseudoElement: "::view-transition-new(root)",
              }
            );
          }).catch(() => {});
        } catch {
          switchTheme();
        }
      },
    };
  }
  return context;
}
