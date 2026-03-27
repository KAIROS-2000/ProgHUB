import { SiteHeader } from '@/components/site-header'
import { ForumView } from '@/components/forum-view'

export default function ForumPage() {
  return (
    <main>
      <SiteHeader />
      <div className="mx-auto max-w-7xl space-y-6 px-6 py-10">
        <section className="codequest-card p-8">
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-sky-600">Сообщество</p>
          <h1 className="mt-2 text-4xl font-black text-slate-900">Форум помощи</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">Раздел для вопросов, обмена решениями и поддержки внутри учебного сообщества.</p>
        </section>
        <ForumView />
      </div>
    </main>
  )
}
