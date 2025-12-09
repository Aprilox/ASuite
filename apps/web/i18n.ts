import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';

const locales = ['fr', 'en'] as const;
type Locale = (typeof locales)[number];
const defaultLocale: Locale = 'fr';

export default getRequestConfig(async () => {
  // 1. Essayer de récupérer la locale depuis le cookie
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get('locale')?.value as Locale | undefined;
  
  if (cookieLocale && locales.includes(cookieLocale)) {
    return {
      locale: cookieLocale,
      messages: (await import(`./messages/${cookieLocale}.json`)).default,
    };
  }

  // 2. Détecter la langue du navigateur via Accept-Language
  const headerStore = await headers();
  const acceptLanguage = headerStore.get('accept-language');
  
  if (acceptLanguage) {
    const browserLocales = acceptLanguage
      .split(',')
      .map((part) => {
        const [locale] = part.trim().split(';');
        return locale.split('-')[0];
      });

    for (const browserLocale of browserLocales) {
      if (locales.includes(browserLocale as Locale)) {
        return {
          locale: browserLocale as Locale,
          messages: (await import(`./messages/${browserLocale}.json`)).default,
        };
      }
    }
  }

  // 3. Langue par défaut
  return {
    locale: defaultLocale,
    messages: (await import(`./messages/${defaultLocale}.json`)).default,
  };
});

