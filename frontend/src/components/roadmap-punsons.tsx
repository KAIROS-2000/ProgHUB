'use client'

import { useEffect, useMemo, useRef } from 'react'
import Link from 'next/link'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ModuleItem } from '@/types'

gsap.registerPlugin(ScrollTrigger)

export function RoadmapPunsons({ title, modules }: { title: string; modules: ModuleItem[] }) {
  const ref = useRef<HTMLDivElement>(null)

  const entries = useMemo(
    () =>
      modules.flatMap((module) =>
        module.lessons.map((lesson, index) => ({
          key: `${module.id}-${lesson.id}`,
          module,
          lesson,
          side: (lesson.order_index + module.order_index + index) % 2 === 0 ? 'left' : 'right',
        })),
      ),
    [modules],
  )

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.roadmap-node',
        { opacity: 0, y: 40, scale: 0.92 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.55,
          stagger: 0.08,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: ref.current,
            start: 'top 78%',
          },
        },
      )

      gsap.to('.roadmap-current', {
        scale: 1.08,
        repeat: -1,
        yoyo: true,
        duration: 1.2,
        ease: 'sine.inOut',
      })
    }, ref)

    return () => ctx.revert()
  }, [entries.length])

  return (
    <section className="codequest-card grid-bg overflow-hidden p-6 sm:p-8" ref={ref}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-sky-600">Roadmap</p>
          <h2 className="mt-1 text-3xl font-black text-slate-900">{title}</h2>
        </div>
        <div className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">{entries.length} уроков на пути</div>
      </div>

      <div className="relative mx-auto mt-8 max-w-5xl pb-8 pt-4">
        <div className="roadmap-gradient absolute left-1/2 top-0 h-full w-3 -translate-x-1/2 rounded-full opacity-80 shadow-[0_0_40px_rgba(74,144,217,0.25)]" />
        <div className="space-y-10">
          {entries.map(({ key, module, lesson, side }) => {
            const state = lesson.state || 'open'
            const isLocked = state === 'locked'
            const isCompleted = state === 'completed'
            const bubbleClass = isCompleted
              ? 'bg-emerald-500 text-white ring-emerald-200'
              : state === 'current'
                ? 'roadmap-current bg-sky-600 text-white ring-sky-200'
                : isLocked
                  ? 'bg-slate-300 text-slate-700 ring-slate-100'
                  : 'bg-white text-slate-900 ring-sky-100'

            return (
              <div key={key} className="roadmap-node relative flex items-center justify-center">
                <div className={`absolute left-1/2 top-1/2 h-1 w-[17%] -translate-y-1/2 ${side === 'left' ? '-translate-x-full' : ''} rounded-full bg-slate-200`} />
                <div className={`flex w-full items-center ${side === 'left' ? 'justify-start pr-[52%]' : 'justify-end pl-[52%]'}`}>
                  <div className={`w-full max-w-sm rounded-[26px] border border-white/70 p-5 shadow-xl ${isLocked ? 'bg-slate-100/90' : 'bg-white/90'}`}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">{module.title}</p>
                      <span className="rounded-full px-3 py-1 text-xs font-bold text-white" style={{ backgroundColor: module.color }}>{module.age_group}</span>
                    </div>
                    <h3 className="mt-3 text-xl font-black text-slate-900">{lesson.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{lesson.summary}</p>
                    <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                      <span>{lesson.duration_minutes} мин</span>
                      <span>•</span>
                      <span>Порог {lesson.passing_score}%</span>
                    </div>
                    <div className="mt-4 flex gap-3">
                      <Link
                        href={isLocked ? '#' : `/lessons/${lesson.id}`}
                        className={`rounded-full px-4 py-2 text-sm font-semibold ${
                          isLocked ? 'bg-slate-200 text-slate-500' : 'bg-slate-900 text-white'
                        }`}
                      >
                        {isLocked ? 'Заблокировано' : 'Открыть урок'}
                      </Link>
                      <span className="rounded-full bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700">{state === 'current' ? 'Текущий' : state === 'completed' ? 'Пройден' : isLocked ? 'После предыдущего' : 'Доступен'}</span>
                    </div>
                  </div>
                </div>
                <div className={`absolute left-1/2 flex h-24 w-24 -translate-x-1/2 items-center justify-center rounded-full ring-8 shadow-lg ${bubbleClass}`}>
                  <div className="text-center">
                    <div className="text-2xl font-black">{lesson.order_index}</div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.18em]">{module.age_group}</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
