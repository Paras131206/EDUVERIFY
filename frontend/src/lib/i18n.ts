import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import hi from './locales/hi.json';

const savedLang = (() => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem('eduverify_lang') || 'en';
    }
  } catch {
    // ignore
  }
  return 'en';
})();

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    hi: { translation: hi },
  },
  lng: savedLang,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

if (typeof window !== 'undefined') {
  i18n.on('languageChanged', (lng) => {
    try {
      if (window.localStorage) {
        window.localStorage.setItem('eduverify_lang', lng);
      }
    } catch {
      // ignore
    }
  });
}

export default i18n;
