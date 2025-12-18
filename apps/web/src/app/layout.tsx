import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { getLocale } from 'next-intl/server';
import './globals.css';
import { AuthProvider } from '@/providers/auth-provider';
import { ThemeProvider } from '@/providers/theme-provider';
import { LocaleProvider } from '@/providers/locale-provider';
import { NotificationsProvider } from '@/providers/notifications-provider';
import { ConfirmProvider } from '@/components/ui/confirm-dialog';
import { ToastProvider } from '@/components/ui/toast';
import { VerificationGuard } from '@/components/auth/verification-guard';
import { getSiteSettings } from '@/lib/site-settings';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();

  return {
    title: `${settings.name} - ${settings.description}`,
    description: settings.description,
    keywords: ['suite collaborative', 'productivité', 'cloud', 'sécurisé'],
    icons: {
      icon: [
        { url: '/favicon.svg', type: 'image/svg+xml' },
      ],
      apple: '/favicon.svg',
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`} suppressHydrationWarning>
        <ThemeProvider>
          <LocaleProvider initialLocale={locale as 'fr' | 'en'}>
            <AuthProvider>
              <VerificationGuard />
              <NotificationsProvider>
                <ConfirmProvider>
                  <ToastProvider>
                    {children}
                  </ToastProvider>
                </ConfirmProvider>
              </NotificationsProvider>
            </AuthProvider>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
