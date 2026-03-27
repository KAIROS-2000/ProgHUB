'use client'

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { api } from '@/lib/api'
import { AssignmentItem, ClassroomItem, SubmissionItem, TeacherClassDetail, TeacherOverviewData } from '@/types'

export function TeacherWorkspace() {
  const [overview, setOverview] = useState<TeacherOverviewData | null>(null)
  const [catalog, setCatalog] = useState<Array<{ id: number; title: string }>>([])
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null)
  const [classDetail, setClassDetail] = useState<TeacherClassDetail | null>(null)
  const [assignmentRows, setAssignmentRows] = useState<AssignmentItem[]>([])
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<number | null>(null)
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([])
  const [message, setMessage] = useState('')
  const [classForm, setClassForm] = useState({ name: '', description: '' })
  const [assignmentForm, setAssignmentForm] = useState({ title: '', description: '', lesson_id: '', due_date: '', difficulty: 'medium', xp_reward: '80' })

  async function loadOverview() {
    const data = await api<TeacherOverviewData>('/teacher/overview', undefined, true)
    setOverview(data)
    if (!selectedClassId && data.classes[0]) setSelectedClassId(data.classes[0].id)
  }

  async function loadCatalog() {
    const data = await api<{ lessons: Array<{ id: number; title: string }> }>('/teacher/lesson-catalog', undefined, true)
    setCatalog(data.lessons)
  }

  async function loadClassDetails(classroomId: number) {
    const detail = await api<TeacherClassDetail>(`/teacher/classes/${classroomId}`, undefined, true)
    const assignments = await api<{ assignments: AssignmentItem[] }>(`/teacher/classes/${classroomId}/assignments`, undefined, true)
    setClassDetail(detail)
    setAssignmentRows(assignments.assignments)
    if (!selectedAssignmentId && assignments.assignments[0]) setSelectedAssignmentId(assignments.assignments[0].id)
  }

  async function loadSubmissions(assignmentId: number) {
    const data = await api<{ submissions: SubmissionItem[] }>(`/teacher/assignments/${assignmentId}/submissions`, undefined, true)
    setSubmissions(data.submissions)
  }

  useEffect(() => {
    loadOverview().catch(() => setMessage('Не удалось загрузить данные кабинета учителя. Проверьте доступ и авторизацию.'))
    loadCatalog().catch(() => undefined)
  }, [])

  useEffect(() => {
    if (selectedClassId) loadClassDetails(selectedClassId).catch(() => undefined)
  }, [selectedClassId])

  useEffect(() => {
    if (selectedAssignmentId) loadSubmissions(selectedAssignmentId).catch(() => setSubmissions([]))
  }, [selectedAssignmentId])

  const selectedClass = useMemo<ClassroomItem | undefined>(() => overview?.classes.find((item) => item.id === selectedClassId), [overview, selectedClassId])

  async function createClass(event: FormEvent) {
    event.preventDefault()
    await api('/teacher/classes', { method: 'POST', body: JSON.stringify(classForm) }, true)
    setClassForm({ name: '', description: '' })
    setMessage('Класс создан.')
    await loadOverview()
  }

  async function createAssignment(event: FormEvent) {
    event.preventDefault()
    if (!selectedClassId) return
    await api(`/teacher/classes/${selectedClassId}/assignments`, {
      method: 'POST',
      body: JSON.stringify({
        ...assignmentForm,
        lesson_id: assignmentForm.lesson_id ? Number(assignmentForm.lesson_id) : null,
        xp_reward: Number(assignmentForm.xp_reward),
      }),
    }, true)
    setAssignmentForm({ title: '', description: '', lesson_id: '', due_date: '', difficulty: 'medium', xp_reward: '80' })
    setMessage('Задание назначено классу.')
    await loadClassDetails(selectedClassId)
  }

  async function gradeSubmission(submissionId: number, currentScore: number, currentFeedback?: string | null) {
    await api(`/teacher/submissions/${submissionId}/grade`, {
      method: 'PATCH',
      body: JSON.stringify({ score: currentScore, feedback: currentFeedback || 'Проверено учителем.', status: 'checked' }),
    }, true)
    setMessage('Проверка сохранена.')
    if (selectedAssignmentId) await loadSubmissions(selectedAssignmentId)
  }

  return (
    <div className="space-y-6">
      {message && <div className="codequest-card bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">{message}</div>}

      <section className="grid gap-4 md:grid-cols-4">
        {[
          ['Классы', String(overview?.summary.classes || 0)],
          ['Ученики', String(overview?.summary.students || 0)],
          ['Задания', String(overview?.summary.assignments || 0)],
          ['Сдачи', String(overview?.summary.submissions || 0)],
        ].map(([label, value]) => (
          <div key={label} className="codequest-card p-5">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">{label}</p>
            <p className="mt-3 text-4xl font-black text-slate-900">{value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <form onSubmit={createClass} className="codequest-card p-6">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-600">Новый класс</p>
            <div className="mt-4 space-y-3">
              <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Название класса" value={classForm.name} onChange={(e) => setClassForm({ ...classForm, name: e.target.value })} />
              <textarea className="min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Описание" value={classForm.description} onChange={(e) => setClassForm({ ...classForm, description: e.target.value })} />
              <button className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Создать класс</button>
            </div>
          </form>

          <div className="codequest-card p-6">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-600">Мои классы</p>
            <div className="mt-4 space-y-3">
              {overview?.classes.map((item) => (
                <button key={item.id} type="button" onClick={() => setSelectedClassId(item.id)} className={`w-full rounded-2xl border px-4 py-4 text-left ${selectedClassId === item.id ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-800'}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-lg font-black">{item.name}</p>
                      <p className={`text-sm ${selectedClassId === item.id ? 'text-slate-300' : 'text-slate-500'}`}>Код входа: {item.code}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${selectedClassId === item.id ? 'bg-white text-slate-900' : 'bg-sky-50 text-sky-700'}`}>{item.students_count} учен.</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <section className="codequest-card p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-600">Выбранный класс</p>
                <h2 className="mt-2 text-3xl font-black text-slate-900">{selectedClass?.name || 'Выберите класс'}</h2>
              </div>
              {selectedClass && <span className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Код {selectedClass.code}</span>}
            </div>
            <p className="mt-3 text-slate-600">{classDetail?.classroom.description || 'Здесь будет список учеников, статистика и назначенные задания.'}</p>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {classDetail?.students.map((student) => (
                <div key={student.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-lg font-black text-slate-900">{student.full_name}</p>
                  <p className="text-sm text-slate-500">@{student.username}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
                    <span className="rounded-full bg-white px-3 py-1">XP {student.xp}</span>
                    <span className="rounded-full bg-white px-3 py-1">Уровень {student.level}</span>
                    <span className="rounded-full bg-white px-3 py-1">Уроков {student.completed_lessons}</span>
                    <span className="rounded-full bg-white px-3 py-1">Средний балл {student.average_score}%</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <form onSubmit={createAssignment} className="codequest-card p-6">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-600">Назначить задание</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Название задания" value={assignmentForm.title} onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })} />
              <select className="rounded-2xl border border-slate-200 px-4 py-3" value={assignmentForm.lesson_id} onChange={(e) => setAssignmentForm({ ...assignmentForm, lesson_id: e.target.value })}>
                <option value="">Без привязки к уроку</option>
                {catalog.map((lesson) => <option key={lesson.id} value={lesson.id}>{lesson.title}</option>)}
              </select>
              <input className="rounded-2xl border border-slate-200 px-4 py-3" type="date" value={assignmentForm.due_date} onChange={(e) => setAssignmentForm({ ...assignmentForm, due_date: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <select className="rounded-2xl border border-slate-200 px-4 py-3" value={assignmentForm.difficulty} onChange={(e) => setAssignmentForm({ ...assignmentForm, difficulty: e.target.value })}>
                  <option value="easy">easy</option>
                  <option value="medium">medium</option>
                  <option value="hard">hard</option>
                </select>
                <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="XP" value={assignmentForm.xp_reward} onChange={(e) => setAssignmentForm({ ...assignmentForm, xp_reward: e.target.value })} />
              </div>
              <textarea className="min-h-28 rounded-2xl border border-slate-200 px-4 py-3 md:col-span-2" placeholder="Описание задания" value={assignmentForm.description} onChange={(e) => setAssignmentForm({ ...assignmentForm, description: e.target.value })} />
            </div>
            <button disabled={!selectedClassId} className="mt-4 rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Добавить задание</button>
          </form>

          <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="codequest-card p-6">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-600">Задания класса</p>
              <div className="mt-4 space-y-3">
                {assignmentRows.map((assignment) => (
                  <button key={assignment.id} type="button" onClick={() => setSelectedAssignmentId(assignment.id)} className={`w-full rounded-2xl border px-4 py-4 text-left ${selectedAssignmentId === assignment.id ? 'border-sky-600 bg-sky-50' : 'border-slate-200 bg-white'}`}>
                    <p className="font-black text-slate-900">{assignment.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{assignment.difficulty} · дедлайн {assignment.due_date || 'без срока'}</p>
                    <p className="mt-2 text-xs font-semibold text-slate-600">Сдач: {assignment.submissions_count || 0} · Проверено: {assignment.checked_count || 0}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="codequest-card p-6">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-600">Проверка сдач</p>
              <div className="mt-4 space-y-4">
                {submissions.map((submission) => (
                  <div key={submission.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-black text-slate-900">@{submission.student_username}</p>
                        <p className="text-sm text-slate-500">{new Date(submission.submitted_at).toLocaleString('ru-RU')}</p>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-700">{submission.score}%</span>
                    </div>
                    <pre className="mt-3 overflow-auto rounded-2xl bg-slate-950 p-4 text-xs leading-6 text-emerald-200">{submission.answer}</pre>
                    <textarea defaultValue={submission.feedback || ''} onBlur={(e) => gradeSubmission(submission.id, submission.score, e.target.value)} className="mt-3 min-h-24 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3" placeholder="Комментарий ученику" />
                  </div>
                ))}
                {selectedAssignmentId && submissions.length === 0 && <p className="text-sm text-slate-500">У этого задания пока нет сдач.</p>}
              </div>
            </div>
          </section>
        </div>
      </section>
    </div>
  )
}
