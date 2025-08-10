
import type {Metadata, Viewport} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

import { PWAInstallPrompt } from '@/components/ui/pwa-install';

export const metadata: Metadata = {
  title: 'CommonTable',
  description: 'A resource sharing platform for churches.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'CommonTable',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'CommonTable',
    title: 'CommonTable - Church Community Marketplace',
    description: 'A resource sharing platform for churches.',
  },
  twitter: {
    card: 'summary',
    title: 'CommonTable - Church Community Marketplace',
    description: 'A resource sharing platform for churches.',
  },
};

export const viewport: Viewport = {
  themeColor: '#665CF0',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@700&family=Roboto:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        {children}
        <Toaster />
        <PWAInstallPrompt />
{/* Service worker temporarily disabled for debugging */}
      </body>
    </html>
  );
}
