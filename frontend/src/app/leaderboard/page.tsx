'use client'

import { useEffect, useState } from 'react'
import { SiteHeader } from '@/components/site-header'
import { api } from '@/lib/api'

interface Row {
  position: number
  username: string
  avatar: string
  xp: number
  level: number
  age_group: string
}

export default function LeaderboardPage() {
  const [rows, setRows] = useState<Row[]>([])

  useEffect(() => {
    api<{ leaderboard: Row[] }>('/leaderboard', undefined, true).then((data) => setRows(data.leaderboard)).catch(() => setRows([]))
  }, [])

  return (
    <main>
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-6 py-10">
        <section className="codequest-card overflow-hidden p-8">
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-amber-600">Топ игроков</p>
          <h1 className="mt-2 text-4xl font-black text-slate-900">Рейтинг учеников</h1>
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 text-sm text-slate-500">
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Ник</th>
                  <th className="px-4 py-3">Возрастная группа</th>
                  <th className="px-4 py-3">Уровень</th>
                  <th className="px-4 py-3">XP</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.position} className="border-b border-slate-100 text-sm">
                    <td className="px-4 py-4 font-bold text-slate-900">{row.position}</td>
                    <td className="px-4 py-4">{row.username}</td>
                    <td className="px-4 py-4">{row.age_group}</td>
                    <td className="px-4 py-4">{row.level}</td>
                    <td className="px-4 py-4 font-semibold text-sky-700">{row.xp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  )
}
