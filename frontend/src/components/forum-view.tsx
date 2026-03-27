'use client'

import { FormEvent, useEffect, useState } from 'react'
import { api } from '@/lib/api'

interface ForumPostItem {
  id: number
  module_id: number | null
  author: string
  title: string
  body: string
  likes: number
  thanks: number
  created_at: string
}

export function ForumView() {
  const [posts, setPosts] = useState<ForumPostItem[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({
    title: '',
    body: '',
    module_id: '',
  })

  async function loadPosts() {
    const response = await api<{ posts: ForumPostItem[] }>('/forum/posts', undefined, true)
    setPosts(response.posts)
  }

  useEffect(() => {
    loadPosts()
      .catch((e) => setError(e instanceof Error ? e.message : 'Не удалось загрузить форум.'))
      .finally(() => setLoading(false))
  }, [])

  async function createPost(event: FormEvent) {
    event.preventDefault()
    if (!form.title.trim() || !form.body.trim()) {
      setMessage('Заполните заголовок и текст вопроса.')
      return
    }

    setSubmitting(true)
    setError('')
    setMessage('')
    try {
      await api('/forum/posts', {
        method: 'POST',
        body: JSON.stringify({
          title: form.title.trim(),
          body: form.body.trim(),
          module_id: form.module_id ? Number(form.module_id) : null,
        }),
      }, true)
      setForm({ title: '', body: '', module_id: '' })
      await loadPosts()
      setMessage('Пост опубликован.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось опубликовать пост.')
    } finally {
      setSubmitting(false)
    }
  }

  async function thank(postId: number) {
    try {
      await api(`/forum/posts/${postId}/thanks`, { method: 'PATCH' }, true)
      await loadPosts()
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Не удалось отправить спасибо.')
    }
  }

  return (
    <div className="space-y-6">
      {message && <div className="codequest-card bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">{message}</div>}
      {error && <div className="codequest-card bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</div>}

      <section className="codequest-card p-6">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-sky-600">Новый вопрос</p>
        <form onSubmit={createPost} className="mt-4 grid gap-3">
          <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Заголовок темы" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <textarea className="min-h-36 rounded-2xl border border-slate-200 px-4 py-3" placeholder="Опишите вопрос или проблему" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
          <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="ID модуля (необязательно)" value={form.module_id} onChange={(e) => setForm({ ...form, module_id: e.target.value.replace(/[^\d]/g, '') })} />
          <button disabled={submitting} className="w-fit rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">
            {submitting ? 'Публикуем…' : 'Опубликовать'}
          </button>
        </form>
      </section>

      <section className="space-y-4">
        {loading ? (
          <div className="codequest-card p-6">Загружаем посты…</div>
        ) : posts.length === 0 ? (
          <div className="codequest-card p-6 text-slate-600">Пока нет постов. Создайте первую тему.</div>
        ) : (
          posts.map((post) => (
            <article key={post.id} className="codequest-card p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-2xl font-black text-slate-900">{post.title}</h3>
                  <p className="mt-2 text-sm text-slate-500">
                    @{post.author} · {new Date(post.created_at).toLocaleString('ru-RU')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">Спасибо: {post.thanks}</span>
                  <button onClick={() => thank(post.id)} className="rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-700">Сказать спасибо</button>
                </div>
              </div>
              <p className="mt-4 whitespace-pre-wrap text-slate-700">{post.body}</p>
              {post.module_id && <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Модуль #{post.module_id}</p>}
            </article>
          ))
        )}
      </section>
    </div>
  )
}
