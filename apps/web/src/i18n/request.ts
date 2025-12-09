import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';
import { defaultLocale, locales, type Locale } from './config';

export default getRequestConfig(async () => {
  // 1. Essayer de récupérer la locale depuis le cookie
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get('locale')?.value as Locale | undefined;
  
  if (cookieLocale && locales.includes(cookieLocale)) {
    return {
      locale: cookieLocale,
      messages: (await import(`../../messages/${cookieLocale}.json`)).default,
    };
  }

  // 2. Détecter la langue du navigateur via Accept-Language
  const headerStore = await headers();
  const acceptLanguage = headerStore.get('accept-language');
  
  if (acceptLanguage) {
    // Parser Accept-Language: fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7
    const browserLocales = acceptLanguage
      .split(',')
      .map((part) => {
        const [locale] = part.trim().split(';');
        return locale.split('-')[0]; // Prendre juste la langue (fr de fr-FR)
      });

    // Trouver la première langue supportée
    for (const browserLocale of browserLocales) {
      if (locales.includes(browserLocale as Locale)) {
        return {
          locale: browserLocale as Locale,
          messages: (await import(`../../messages/${browserLocale}.json`)).default,
        };
      }
    }
  }

  // 3. Langue par défaut
  return {
    locale: defaultLocale,
    messages: (await import(`../../messages/${defaultLocale}.json`)).default,
  };
});

