'use client'

import { useEffect, useState } from 'react'
import { SiteHeader } from '@/components/site-header'
import { RoadmapPunsons } from '@/components/roadmap-punsons'
import { api } from '@/lib/api'
import { ModuleItem } from '@/types'

export default function RoadmapPage() {
  const [group, setGroup] = useState('middle')
  const [modules, setModules] = useState<ModuleItem[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    api<{ modules: ModuleItem[] }>(`/modules?age_group=${group}`, undefined, true)
      .then((data) => setModules(data.modules))
      .catch((e) => setError(e instanceof Error ? e.message : 'Не удалось загрузить roadmap'))
  }, [group])

  return (
    <main>
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-sky-600">Карта модулей</p>
            <h1 className="mt-2 text-4xl font-black text-slate-900">Roadmap обучения</h1>
          </div>
          <div className="flex gap-3">
            {[
              ['junior', '7–10'],
              ['middle', '11–13'],
              ['senior', '14–15'],
            ].map(([value, label]) => (
              <button key={value} onClick={() => setGroup(value)} className={`rounded-full px-4 py-2 text-sm font-semibold ${group === value ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 shadow-sm'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
        {error ? <div className="codequest-card p-6 text-rose-700">{error}</div> : <RoadmapPunsons title={`Возрастная группа ${group}`} modules={modules} />}
      </div>
    </main>
  )
}
