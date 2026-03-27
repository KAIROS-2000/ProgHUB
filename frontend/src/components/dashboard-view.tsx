'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { DashboardData } from '@/types'
import { RolePill } from '@/components/role-pill'
import { StatCard } from '@/components/stat-card'

export function DashboardView() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState('')
  const [classCode, setClassCode] = useState('')
  const [message, setMessage] = useState('')

  async function loadDashboard() {
    const result = await api<DashboardData>('/dashboard', undefined, true)
    setData(result)
  }

  useEffect(() => {
    loadDashboard().catch((e) => setError(e instanceof Error ? e.message : 'Не удалось загрузить dashboard'))
  }, [])

  async function joinClass() {
    if (!classCode.trim()) {
      setMessage('Введите код класса перед отправкой.')
      return
    }
    try {
      await api('/classes/join', { method: 'POST', body: JSON.stringify({ code: classCode.trim() }) }, true)
      setMessage('Класс успешно подключён.')
      setClassCode('')
      await loadDashboard()
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Не удалось вступить в класс.')
    }
  }

  async function generateParentInvite() {
    try {
      await api('/parent/invite', { method: 'POST', body: JSON.stringify({ label: 'Семейный кабинет' }) }, true)
      setMessage('Семейная ссылка обновлена.')
      await loadDashboard()
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Не удалось обновить семейную ссылку.')
    }
  }

  if (error) {
    return <div className="codequest-card p-6 text-rose-700">{error}. Проверьте авторизацию и повторите попытку.</div>
  }

  if (!data) {
    return <div className="codequest-card p-6">Загружаем данные dashboard…</div>
  }

  return (
    <div className="space-y-8">
      {message && <div className="codequest-card bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">{message}</div>}

      <section className="codequest-card overflow-hidden p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <RolePill role={data.user.role} />
            <h2 className="mt-3 text-4xl font-black text-slate-900">Привет, {data.user.full_name.split(' ')[0]}!</h2>
            <p className="mt-3 max-w-2xl text-lg leading-8 text-slate-600">
              Ты на уровне <span className="font-bold text-slate-900">{data.user.level}</span> — {data.user.rank_title}. До следующего уровня осталось <span className="font-bold text-slate-900">{data.user.xp_to_next} XP</span>.
            </p>
          </div>
          <div className="codequest-card min-w-[280px] bg-slate-900 p-5 text-white">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-300">Продолжить</p>
            {data.continue_lesson ? (
              <>
                <h3 className="mt-2 text-2xl font-black">{data.continue_lesson.title}</h3>
                <p className="mt-2 text-sm text-slate-300">{data.continue_lesson.summary}</p>
                <Link href={`/lessons/${data.continue_lesson.id}`} className="mt-4 inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900">
                  Открыть урок
                </Link>
              </>
            ) : (
              <p className="mt-2 text-sm text-slate-300">Все доступные уроки пройдены. Выберите новый модуль на roadmap.</p>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard value={String(data.summary.completed_lessons)} label="завершённых уроков" accent="text-sky-600" />
        <StatCard value={String(data.summary.assignments_open)} label="активных заданий" accent="text-emerald-600" />
        <StatCard value={String(data.summary.achievements)} label="достижений" accent="text-violet-600" />
        <StatCard value={`${data.user.streak} 🔥`} label="дней подряд" accent="text-amber-600" />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <article className="codequest-card p-6">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-sky-600">Daily quests</p>
          <h3 className="mt-2 text-2xl font-black text-slate-900">Ежедневные задачи</h3>
          <div className="mt-5 space-y-3">
            {data.daily_quests.map((quest) => (
              <div key={quest.id} className="flex items-center justify-between rounded-[22px] bg-slate-50 px-4 py-4">
                <div>
                  <p className="font-bold text-slate-900">{quest.title}</p>
                  <p className="text-sm text-slate-500">Награда: {quest.xp} XP</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] ${quest.completed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {quest.completed ? 'Готово' : 'В процессе'}
                </span>
              </div>
            ))}
          </div>
        </article>

        <article className="codequest-card p-6">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-sky-600">Награды</p>
          <h3 className="mt-2 text-2xl font-black text-slate-900">Последние достижения</h3>
          <div className="mt-5 grid gap-3">
            {data.recent_achievements.length > 0 ? data.recent_achievements.map((item) => (
              <div key={item.id} className="rounded-[22px] bg-white px-4 py-4 shadow-sm">
                <p className="font-bold text-slate-900">{item.name}</p>
                <p className="mt-1 text-sm text-slate-500">{item.description}</p>
                <p className="mt-2 text-sm font-semibold text-sky-600">+{item.xp_reward} XP</p>
              </div>
            )) : <p className="text-sm text-slate-500">Пока нет достижений — начни с первого урока.</p>}
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <article className="codequest-card p-6">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-sky-600">Мои классы</p>
          <h3 className="mt-2 text-2xl font-black text-slate-900">Учительские группы и домашние задания</h3>
          <div className="mt-5 flex flex-wrap gap-3">
            <input className="min-w-[220px] flex-1 rounded-2xl border border-slate-200 px-4 py-3" value={classCode} onChange={(e) => setClassCode(e.target.value.toUpperCase())} placeholder="Введите код класса" />
            <button onClick={joinClass} className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white">Вступить в класс</button>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {data.my_classes.length ? data.my_classes.map((classroom) => (
              <div key={classroom.id} className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-lg font-black text-slate-900">{classroom.name}</p>
                <p className="mt-2 text-sm text-slate-600">Код: {classroom.code}</p>
                <p className="mt-1 text-sm text-slate-500">Заданий: {classroom.assignments_count} · Учеников: {classroom.students_count}</p>
              </div>
            )) : <p className="text-sm text-slate-500">Пока нет подключённых классов. Введите код, полученный от вашего учителя.</p>}
          </div>
        </article>

        <article className="codequest-card p-6">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-sky-600">Семья</p>
          <h3 className="mt-2 text-2xl font-black text-slate-900">Родительский кабинет</h3>
          <p className="mt-3 text-sm leading-7 text-slate-600">Создайте семейную ссылку, чтобы родители видели прогресс, активности и модули ребёнка.</p>
          <div className="mt-5 rounded-[24px] bg-slate-50 p-5">
            {data.parent_invite ? (
              <>
                <p className="font-bold text-slate-900">Активный код: {data.parent_invite.code}</p>
                <p className="mt-2 text-sm text-slate-500">Открыть кабинет: <Link href={`/parent/${data.parent_invite.code}`} className="font-semibold text-sky-700">/parent/{data.parent_invite.code}</Link></p>
                <p className="mt-2 text-sm text-slate-500">Лимит: {data.parent_invite.weekly_limit_minutes || 'не задан'} мин/нед</p>
              </>
            ) : (
              <p className="text-sm text-slate-500">Ещё нет семейной ссылки.</p>
            )}
          </div>
          <button onClick={generateParentInvite} className="mt-4 rounded-full bg-violet-600 px-5 py-3 text-sm font-semibold text-white">Создать или обновить семейную ссылку</button>
        </article>
      </section>
    </div>
  )
}
