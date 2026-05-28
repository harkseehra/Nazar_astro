import type { Metadata } from 'next';
import { Inter, Gentium_Plus, Vazirmatn } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const gentium = Gentium_Plus({
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  variable: '--font-gentium',
});
const vazir = Vazirmatn({ subsets: ['arabic'], weight: ['400', '500'], variable: '--font-vazir' });

export const metadata: Metadata = {
  title: 'Nazar — The sky, today.',
  description: 'The current sky, computed precisely. Classical astrology rooted in the Hellenistic and Islamic tradition. Daily.',
  openGraph: {
    title: 'Nazar — The sky, today.',
    description: 'The current sky, computed precisely. Classical astrology rooted in the Hellenistic and Islamic tradition.',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Nazar — The sky, today.',
    description: 'The current sky, computed precisely.',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${gentium.variable} ${vazir.variable} antialiased`}
        style={{ background: '#0A0E14', color: '#E8ECF0' }}
      >
        {children}
      </body>
    </html>
  );
}
