'use client';

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { type Locale, locales, defaultLocale, localeNames, localeFlags } from '@/i18n/config';

// Import des messages
import frMessages from '../../messages/fr.json';
import enMessages from '../../messages/en.json';

const messagesMap: Record<Locale, typeof frMessages> = {
  fr: frMessages,
  en: enMessages,
};

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  locales: readonly Locale[];
  localeNames: Record<Locale, string>;
  localeFlags: Record<Locale, string>;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

interface LocaleProviderProps {
  children: ReactNode;
  initialLocale?: Locale;
}

export function LocaleProvider({ children, initialLocale }: LocaleProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale || defaultLocale);
  const [messages, setMessages] = useState(messagesMap[initialLocale || defaultLocale]);

  // Charger la locale depuis le cookie au montage
  useEffect(() => {
    const cookieLocale = document.cookie
      .split('; ')
      .find((row) => row.startsWith('locale='))
      ?.split('=')[1] as Locale | undefined;

    if (cookieLocale && locales.includes(cookieLocale)) {
      setLocaleState(cookieLocale);
      setMessages(messagesMap[cookieLocale]);
    }
  }, []);

  const setLocale = useCallback(async (newLocale: Locale) => {
    if (!locales.includes(newLocale)) return;

    // Sauvegarder dans le cookie (expire dans 1 an)
    document.cookie = `locale=${newLocale}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    
    // Mettre à jour l'état et les messages instantanément
    setLocaleState(newLocale);
    setMessages(messagesMap[newLocale]);

    // Sauvegarder en DB si connecté (en arrière-plan, ignorer les erreurs)
    fetch('/api/auth/locale', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale: newLocale }),
    }).catch(() => {
      // Ignore les erreurs (utilisateur non connecté)
    });

    // PAS de reload - les messages sont mis à jour dynamiquement !
  }, []);

  return (
    <LocaleContext.Provider
      value={{
        locale,
        setLocale,
        locales,
        localeNames,
        localeFlags,
      }}
    >
      <NextIntlClientProvider locale={locale} messages={messages}>
        {children}
      </NextIntlClientProvider>
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
}

// Hook pour appliquer la locale de l'utilisateur connecté (à la connexion)
export function useApplyUserLocale() {
  const { locale, setLocale } = useLocale();

  const applyUserLocale = useCallback((userLocale: string | null | undefined) => {
    if (userLocale && locales.includes(userLocale as Locale) && userLocale !== locale) {
      setLocale(userLocale as Locale);
    }
  }, [locale, setLocale]);

  return { applyUserLocale };
}
