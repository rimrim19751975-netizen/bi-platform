import type { Metadata } from 'next';
import '@/styles/globals.css';
import { AppLayout } from '@/components/layout/AppLayout';

export const metadata: Metadata = {
  title: 'BI Platform - Business Intelligence',
  description: 'Plateforme de Business Intelligence pour la gestion et l\'analyse de données',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" dir="ltr" suppressHydrationWarning>
      <body>
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
