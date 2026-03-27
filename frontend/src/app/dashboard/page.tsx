import { DashboardView } from '@/components/dashboard-view'
import { SiteHeader } from '@/components/site-header'

export default function DashboardPage() {
  return (
    <main>
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-6 py-10">
        <DashboardView />
      </div>
    </main>
  )
}
