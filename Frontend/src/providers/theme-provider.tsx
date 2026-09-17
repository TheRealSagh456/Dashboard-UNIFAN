import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  ThemeContext,
  type Theme,
  type ThemeContextValue,
} from "./theme-context";

const THEME_STORAGE_KEY = "unifan-theme";
const DARK_THEME_QUERY = "(prefers-color-scheme: dark)";

function getStoredTheme(): Theme | null {
  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  return storedTheme === "light" || storedTheme === "dark"
    ? storedTheme
    : null;
}

function getSystemTheme(): Theme {
  return window.matchMedia(DARK_THEME_QUERY).matches ? "dark" : "light";
}

function getInitialTheme(): Theme {
  return getStoredTheme() ?? getSystemTheme();
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", theme === "dark" ? "#050b18" : "#f2e8dc");
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [followsSystem, setFollowsSystem] = useState(
    () => getStoredTheme() === null,
  );

  useLayoutEffect(() => applyTheme(theme), [theme]);

  useEffect(() => {
    if (!followsSystem) return;

    const mediaQuery = window.matchMedia(DARK_THEME_QUERY);
    const handleChange = () => setTheme(mediaQuery.matches ? "dark" : "light");
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [followsSystem]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      toggleTheme: () => {
        setFollowsSystem(false);
        setTheme((currentTheme) => {
          const nextTheme = currentTheme === "light" ? "dark" : "light";
          window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
          return nextTheme;
        });
      },
    }),
    [theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
