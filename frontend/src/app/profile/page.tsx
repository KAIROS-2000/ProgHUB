import { SiteHeader } from '@/components/site-header'
import { ProfileView } from '@/components/profile-view'

export default function ProfilePage() {
  return (
    <main>
      <SiteHeader />
      <div className="mx-auto max-w-7xl space-y-6 px-6 py-10">
        <section className="codequest-card p-8">
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-sky-600">Профиль</p>
          <h1 className="mt-2 text-4xl font-black text-slate-900">Личный кабинет пользователя</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">Управляйте персональными настройками и отслеживайте достижения в едином профиле.</p>
        </section>
        <ProfileView />
      </div>
    </main>
  )
}
