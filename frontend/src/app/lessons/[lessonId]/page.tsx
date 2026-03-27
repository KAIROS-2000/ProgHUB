import { SiteHeader } from '@/components/site-header'
import { LessonPlayer } from '@/components/lesson-player'

export default async function LessonPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params
  return (
    <main>
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-6 py-10">
        <LessonPlayer lessonId={Number(lessonId)} />
      </div>
    </main>
  )
}
