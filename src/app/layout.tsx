import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import 'katex/dist/katex.min.css';
import '@/app/globals.css';
import { ThemeProvider } from '@/components/providers/theme-provider';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Learning Platform — платформа для обучения',
    template: '%s | Learning Platform',
  },
  description:
    'Платформа для обучения: домашние задания с математическими формулами, привязка учеников к учителям, автопроверка работ.',
  keywords: ['домашние задания', 'обучение', 'математика', 'LaTeX', 'учитель', 'ученик'],
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: '/apple-icon.png',
  },
  manifest: undefined,
  openGraph: {
    title: 'Learning Platform',
    description: 'Домашние задания с формулами, автосохранением и автопроверкой.',
    type: 'website',
    locale: 'ru_RU',
  },
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ru" suppressHydrationWarning className={inter.variable}>
      <body className="min-h-screen font-sans">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
