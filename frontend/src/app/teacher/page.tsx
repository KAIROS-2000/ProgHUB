import { SiteHeader } from '@/components/site-header'
import { TeacherWorkspace } from '@/components/teacher-workspace'

export default function TeacherPage() {
  return (
    <main>
      <SiteHeader />
      <div className="mx-auto max-w-7xl space-y-6 px-6 py-10">
        <section className="codequest-card p-8">
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-emerald-600">Кабинет учителя</p>
          <h1 className="mt-2 text-4xl font-black text-slate-900">Классы, авторские уроки и проверка работ</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">Учитель создаёт классы, собирает свои уроки прямо в кабинете, привязывает их к заданиям и отслеживает ответы учеников в одном рабочем пространстве.</p>
        </section>
        <TeacherWorkspace />
      </div>
    </main>
  )
}
