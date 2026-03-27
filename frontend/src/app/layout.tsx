import type { Metadata } from 'next'
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

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  )
}
