import Providers from '@/src/presentation/providers/Providers';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: { default: 'Nowly', template: '%s | Nowly' },
  description: 'Today-first task management for focused productivity.',
  authors: [{ name: 'Patrick Alvarez', url: 'https://patrickalvarez.com' }],
  creator: 'Patrick Alvarez',
  publisher: 'Patrick Alvarez',
  icons: {
    icon: '/favicon.ico',
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full m-0 p-0">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full m-0 p-0`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
