'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SiteHeader } from '@/components/site-header'

export default function ParentEntryPage() {
  const [code, setCode] = useState('')
  const router = useRouter()

  return (
    <main>
      <SiteHeader />
      <div className="mx-auto max-w-4xl px-6 py-10">
        <section className="codequest-card p-8">
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-violet-600">Родительский доступ</p>
          <h1 className="mt-2 text-4xl font-black text-slate-900">Открыть кабинет родителя</h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">Введите семейный код, который вам передал ученик. Код открывает только связанный родительский кабинет.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <input className="min-w-[260px] flex-1 rounded-2xl border border-slate-200 px-4 py-3" value={code} onChange={(e) => setCode(e.target.value.trim())} placeholder="Например, PAR-AB12CD34" />
            <button disabled={!code} onClick={() => router.push(`/parent/${code}`)} className="rounded-full bg-slate-900 px-6 py-3 font-semibold text-white disabled:opacity-50">Открыть</button>
          </div>
        </section>
      </div>
    </main>
  )
}
