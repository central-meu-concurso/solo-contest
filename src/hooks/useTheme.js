import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'solo-contest-theme';

export function getInitialTheme() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch (e) { /* ignore */ }
  return 'system';
}

export function useTheme() {
  const [theme, setThemeState] = useState(getInitialTheme);
  const [isDark, setIsDark] = useState(() => {
    const t = getInitialTheme();
    return t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    const apply = () => {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const dark = theme === 'dark' || (theme === 'system' && prefersDark);
      document.documentElement.classList.toggle('dark', dark);
      setIsDark(dark);
    };
    apply();
    if (theme !== 'system') return undefined;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [theme]);

  const setTheme = useCallback((next) => {
    setThemeState(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch (e) { /* ignore */ }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(isDark ? 'light' : 'dark');
  }, [isDark, setTheme]);

  return { theme, isDark, setTheme, toggleTheme };
}
