import type { Metadata, Viewport } from 'next'
import { ThemeHydrator } from '@/components/theme-hydrator'
import './globals.css'

export const metadata: Metadata = {
  title: 'Кодиумс',
  description: 'Кодиумс — обучающая платформа для школьников по программированию',
  icons: {
    icon: '/kodiums-logo.png',
    shortcut: '/kodiums-logo.png',
    apple: '/kodiums-logo.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" data-theme="light">
      <body>
        <ThemeHydrator />
        {children}
      </body>
    </html>
  )
}
