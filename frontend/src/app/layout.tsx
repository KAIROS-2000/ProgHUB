import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CodeQuest',
  description: 'Полноценная обучающая платформа для школьников по программированию',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  )
}
