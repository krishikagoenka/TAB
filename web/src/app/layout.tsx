import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Providers from '@/components/providers';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TAB — The Group Wallet That Settles Itself',
  description:
    'Split bills, track expenses, and settle debts with your friends — all on Monad. No more awkward Venmo requests.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen bg-surface-900 text-white flex flex-col antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
