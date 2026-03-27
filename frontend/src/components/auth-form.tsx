'use client'

import { FormEvent, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { api } from '@/lib/api'
import { saveTokens } from '@/lib/storage'
import { AuthOptions } from '@/types'

const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/

function strengthLabel(password: string) {
  if (password.length < 6) return 'Слабый'
  const score = [/[A-Z]/.test(password), /\d/.test(password), /[^A-Za-z0-9]/.test(password)].filter(Boolean).length
  if (score >= 2) return 'Сильный'
  return 'Средний'
}

function isValidEmail(value: string) {
  return EMAIL_RE.test(value.trim().toLowerCase())
}

export function AuthForm({ mode, options }: { mode: 'login' | 'register'; options?: AuthOptions }) {
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    full_name: '',
    username: '',
    email: '',
    password: '',
    role: 'student',
    age_group: 'middle',
    avatar: options?.avatars?.[0] || 'robot-blue',
    companion: 'Кодик-робот',
    theme: 'light',
  })

  const strength = useMemo(() => strengthLabel(form.password), [form.password])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const normalizedCredential = form.email.trim().toLowerCase()
    if (mode === 'register' && !isValidEmail(normalizedCredential)) {
      setError('Укажите корректный email.')
      return
    }
    if (mode === 'login' && !normalizedCredential) {
      setError('Укажите email или username.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const payload =
        mode === 'login'
          ? { login: normalizedCredential, password: form.password }
          : { ...form, email: normalizedCredential }

      const result = await api<{ access_token: string; refresh_token: string }>('/auth/' + mode, {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      saveTokens(result.access_token, result.refresh_token)
      window.location.href = '/dashboard'
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось выполнить действие')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="grid min-h-screen place-items-center px-6 py-10">
      <div className="grid w-full max-w-6xl gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="codequest-card grid-bg overflow-hidden p-8 text-slate-900">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-white shadow-lg shadow-sky-200 ring-1 ring-sky-100">
              <Image
                src="/kodiums-logo.png"
                alt="Логотип Кодиумс"
                width={48}
                height={48}
                className="h-12 w-12 rounded-full object-cover"
                priority
              />
            </div>
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-sky-600">Кодиумс</p>
          </div>
          <h1 className="mt-3 text-4xl font-black">{mode === 'login' ? 'С возвращением!' : 'Создай аккаунт и начни путь'}</h1>
          <p className="mt-4 max-w-xl text-lg leading-8 text-slate-600">
            Платформа объединяет регистрацию, уроки, задания, тесты, XP, уровни и классы с учителем в одном красивом интерфейсе.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {[
              ['12+', 'аватаров'],
              ['3', 'возрастные группы'],
              ['4', 'роли доступа'],
              ['∞', 'рост проекта'],
            ].map(([value, label]) => (
              <div key={label} className="rounded-[24px] bg-white/90 p-5 shadow-lg">
                <p className="text-3xl font-black text-slate-900">{value}</p>
                <p className="mt-1 text-sm text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="codequest-card p-8">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.24em] text-sky-600">{mode === 'login' ? 'Вход' : 'Регистрация'}</p>
              <h2 className="mt-1 text-3xl font-black text-slate-900">{mode === 'login' ? 'Войти в аккаунт' : 'Заполнить профиль'}</h2>
            </div>
            <Link href={mode === 'login' ? '/auth/register' : '/auth/login'} className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
              {mode === 'login' ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}
            </Link>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            {mode === 'register' && (
              <div className="grid gap-5 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-600">Имя</span>
                  <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-600">Username</span>
                  <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
                </label>
              </div>
            )}

            <div className="grid gap-5 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-600">{mode === 'login' ? 'Email или Username' : 'Email'}</span>
                <input
                  type={mode === 'login' ? 'text' : 'email'}
                  placeholder={mode === 'login' ? 'Введите email или username' : undefined}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </label>
              {mode === 'register' && (
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-600">Роль</span>
                  <select className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                    {options?.roles?.map((role) => (
                      <option key={role} value={role}>{role === 'student' ? 'Ученик' : 'Учитель'}</option>
                    ))}
                  </select>
                </label>
              )}
            </div>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-600">Пароль</span>
              <div className="flex rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <input className="w-full" type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                <button type="button" className="text-sm font-semibold text-sky-600" onClick={() => setShowPassword((item) => !item)}>
                  {showPassword ? 'Скрыть' : 'Показать'}
                </button>
              </div>
              {mode === 'register' && <p className="text-sm text-slate-500">Надёжность пароля: <span className="font-semibold text-slate-900">{strength}</span></p>}
            </label>

            {mode === 'register' && (
              <>
                <div className="grid gap-5 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-slate-600">Возрастная группа</span>
                    <select className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3" value={form.age_group} onChange={(e) => setForm({ ...form, age_group: e.target.value })}>
                      <option value="junior">Младшая 7–10</option>
                      <option value="middle">Средняя 11–13</option>
                      <option value="senior">Старшая 14–15</option>
                    </select>
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-slate-600">Компаньон</span>
                    <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3" value={form.companion} onChange={(e) => setForm({ ...form, companion: e.target.value })} />
                  </label>
                </div>

                <div className="space-y-3">
                  <span className="text-sm font-semibold text-slate-600">Выбор аватара</span>
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
                    {options?.avatars?.map((avatar) => (
                      <button
                        key={avatar}
                        type="button"
                        className={`rounded-2xl border px-3 py-4 text-xs font-bold uppercase tracking-[0.12em] ${form.avatar === avatar ? 'border-sky-600 bg-sky-50 text-sky-700' : 'border-slate-200 bg-white text-slate-600'}`}
                        onClick={() => setForm({ ...form, avatar })}
                      >
                        {avatar}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {error && <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div>}

            <button disabled={loading} className="mt-3 w-full rounded-2xl bg-slate-900 px-5 py-3 text-base font-bold text-white shadow-lg shadow-slate-300 disabled:opacity-60">
              {loading ? 'Подождите…' : mode === 'login' ? 'Войти' : 'Создать аккаунт'}
            </button>
          </form>
        </section>
      </div>
    </main>
  )
}
