import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/providers/auth-provider';
import { ConfirmProvider } from '@/components/ui/confirm-dialog';
import { ToastProvider } from '@/components/ui/toast';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'ASuite - Suite Collaborative Professionnelle',
  description: 'Communiquez, partagez et donnez vie à vos idées en sécurité avec ASuite.',
  keywords: ['suite collaborative', 'productivité', 'cloud', 'sécurisé'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>
        <AuthProvider>
          <ConfirmProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </ConfirmProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
