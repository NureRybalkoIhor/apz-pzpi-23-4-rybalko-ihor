import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';
type Language = 'en' | 'uk';

interface SettingsState {
  theme: Theme;
  language: Language;
  setTheme: (theme: Theme) => void;
  setLanguage: (lang: Language) => void;
  toggleTheme: () => void;
}

const applyTheme = (theme: Theme) => {
  document.documentElement.setAttribute('data-theme', theme);
};

const savedTheme = (() => {
  try {
    const raw = localStorage.getItem('settings-storage');
    if (raw) return JSON.parse(raw)?.state?.theme || 'light';
  } catch { }
  return 'light';
})();
applyTheme(savedTheme);

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      theme: savedTheme as Theme,
      language: 'uk',
      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
      setLanguage: (language) => set({ language }),
      toggleTheme: () => {
        const newTheme = get().theme === 'light' ? 'dark' : 'light';
        applyTheme(newTheme);
        set({ theme: newTheme });
      },
    }),
    {
      name: 'settings-storage',
    }
  )
);
