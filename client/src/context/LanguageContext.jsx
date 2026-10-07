import React, { createContext, useContext, useState, useEffect } from 'react';
import en from '../translations/en.json';
import ta from '../translations/ta.json';
import te from '../translations/te.json';
import hi from '../translations/hi.json';

const LanguageContext = createContext();

export const translations = {
  en,
  ta,
  te,
  hi
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('vitacare_lang') || localStorage.getItem('healthgpt_lang') || 'en';
  });

  // Sync language with authenticated user profile on mount or user login
  useEffect(() => {
    const syncUserLanguage = async () => {
      const token = localStorage.getItem('healthgpt_token');
      if (token) {
        try {
          const res = await fetch('/api/user/profile', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            const userPref = data.profile?.preferred_language || data.user?.preferred_language;
            if (userPref && ['en', 'ta', 'te', 'hi'].includes(userPref)) {
              setLanguage(userPref);
              localStorage.setItem('vitacare_lang', userPref);
              localStorage.setItem('healthgpt_lang', userPref);
            }
          }
        } catch (e) {
          // offline or token invalid
        }
      }
    };

    syncUserLanguage();

    // Listen for custom login event or storage updates
    const handleStorageChange = (e) => {
      if (e.key === 'vitacare_lang' && e.newValue && ['en', 'ta', 'te', 'hi'].includes(e.newValue)) {
        setLanguage(e.newValue);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('vitacare:auth-login', syncUserLanguage);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('vitacare:auth-login', syncUserLanguage);
    };
  }, []);

  const changeLanguage = async (lang) => {
    if (!['en', 'ta', 'te', 'hi'].includes(lang)) return;
    setLanguage(lang);
    localStorage.setItem('vitacare_lang', lang);
    localStorage.setItem('healthgpt_lang', lang);

    // Persist to user profile in database if logged in (Requirement 13)
    const token = localStorage.getItem('healthgpt_token');
    if (token) {
      try {
        await fetch('/api/user/language', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ language: lang })
        });
      } catch (e) {
        console.warn('Could not persist language to user account in DB:', e);
      }
    }
  };

  const currentDict = translations[language] || translations.en;

  // Translation helper that falls back gracefully to English if a key is missing
  const translateKey = (keyPath, fallback = '') => {
    const keys = keyPath.split('.');
    let val = currentDict;
    for (const k of keys) {
      if (val && typeof val === 'object' && k in val) {
        val = val[k];
      } else {
        // Fallback to English
        let enVal = translations.en;
        for (const ek of keys) {
          if (enVal && typeof enVal === 'object' && ek in enVal) {
            enVal = enVal[ek];
          } else {
            return fallback || keyPath;
          }
        }
        return enVal || fallback || keyPath;
      }
    }
    return val;
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t: currentDict, tr: translateKey, translations }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
