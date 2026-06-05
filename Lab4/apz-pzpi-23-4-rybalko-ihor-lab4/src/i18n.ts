import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import uk from './locales/uk.json';

const savedSettings = (() => {
  try {
    const raw = localStorage.getItem('settings-storage');
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed?.state?.language || 'uk';
    }
  } catch { }
  return 'uk';
})();

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      uk: { translation: uk },
    },
    lng: savedSettings,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
