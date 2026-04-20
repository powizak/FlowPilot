import { useEffect } from 'react';
import { useUiStore } from '../stores/ui';

export const useTheme = () => {
  const { theme, toggleTheme, setTheme } = useUiStore();

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return { theme, toggleTheme, setTheme };
};
