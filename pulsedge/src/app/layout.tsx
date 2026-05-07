import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { TickerBar } from '@/components/layout/TickerBar';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';

export const metadata: Metadata = {
  title: 'Pulsedge · AI Trading Intelligence',
  description:
    'Institutional-grade AI market intelligence for forex, crypto, and equities. Daily bias, precision entry plans, and real-time economic calendar — free.',
  keywords: ['trading', 'market analysis', 'forex', 'crypto', 'AI', 'technical analysis', 'economic calendar', 'trading signals'],
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen flex flex-col">
        <ThemeProvider>
          <TickerBar />
          <Header />
          <main className="flex-1">{children}</main>
          <BottomNav />
        </ThemeProvider>
      </body>
    </html>
  );
}
