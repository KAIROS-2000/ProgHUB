import { AdminWorkspace } from '@/components/admin-workspace'
import { SiteHeader } from '@/components/site-header'

export default function AdminPage() {
  return (
    <main>
      <SiteHeader />
      <div className="mx-auto max-w-7xl space-y-6 px-6 py-10">
        <section className="codequest-card p-8">
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-violet-600">Админ-панель</p>
          <h1 className="mt-2 text-4xl font-black text-slate-900">Контент, публикация модулей и структура курса</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">Админ управляет публикацией модулей, отслеживает статистику платформы и поддерживает структуру учебного контента в актуальном состоянии.</p>
        </section>
        <AdminWorkspace />
      </div>
    </main>
  )
}
