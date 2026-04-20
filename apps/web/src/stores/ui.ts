import { create } from 'zustand';

interface UiState {
  theme: 'dark' | 'light';
  isSearchOpen: boolean;
  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;
  setSearchOpen: (open: boolean) => void;
}

const getInitialTheme = (): 'dark' | 'light' => {
  const saved = localStorage.getItem('theme');
  if (saved === 'dark' || saved === 'light') return saved;
  return 'dark';
};

export const useUiStore = create<UiState>((set) => ({
  theme: getInitialTheme(),
  isSearchOpen: false,
  setTheme: (theme) => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    set({ theme });
  },
  toggleTheme: () => set((state) => {
    const newTheme = state.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    return { theme: newTheme };
  }),
  setSearchOpen: (open) => set({ isSearchOpen: open }),
}));
