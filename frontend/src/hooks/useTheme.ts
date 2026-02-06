import { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({ theme: 'system', isDark: false, setTheme: () => {} });

export function useTheme() {
  return useContext(ThemeContext);
}

export { ThemeContext };
export type { Theme };
