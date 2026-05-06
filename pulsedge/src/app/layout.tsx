import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { TickerBar } from '@/components/layout/TickerBar';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';

export const metadata: Metadata = {
  title: 'Pulsedge — Institutional Market Intelligence',
  description:
    'AI-powered daily market analysis for forex, crypto, and equities. Institutional bias, key levels, and precision entry plans.',
  keywords: ['trading', 'market analysis', 'forex', 'crypto', 'AI', 'technical analysis'],
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
