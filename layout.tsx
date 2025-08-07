
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { SavedListingsProvider } from '@/hooks/use-saved-listings.tsx';
import { ThemeProvider } from '@/components/theme-provider';

export const metadata: Metadata = {
  title: 'CommonTable',
  description: 'A resource sharing platform for churches.',
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
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans antialiased min-h-screen bg-background">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SavedListingsProvider>
            {children}
            <Toaster />
          </SavedListingsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
