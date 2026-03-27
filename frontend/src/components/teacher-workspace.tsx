'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { api } from '@/lib/api'
import {
  AssignmentItem,
  ClassroomItem,
  LessonCatalogItem,
  SubmissionItem,
  TeacherClassDetail,
  TeacherOverviewData,
} from '@/types'

type AssignmentType = AssignmentItem['assignment_type']
type SubmissionFormat = AssignmentItem['submission_format']

type Difficulty = 'easy' | 'medium' | 'hard'

interface AssignmentFormState {
  title: string
  description: string
  lesson_id: string
  due_date: string
  difficulty: Difficulty
  xp_reward: string
  assignment_type: AssignmentType
  submission_format: SubmissionFormat
  learning_goal: string
  work_steps: string
  success_criteria: string
  resources: string
}

interface AssignmentTemplate {
  label: string
  short: string
  title: string
  description: string
  learning_goal: string
  work_steps: string
  success_criteria: string
  resources: string
  submission_format: SubmissionFormat
}

const ASSIGNMENT_TEMPLATES: Record<AssignmentType, AssignmentTemplate> = {
  lesson_practice: {
    label: 'Практика по уроку',
    short: 'Закрепление навыка после конкретного урока.',
    title: 'Практика по уроку',
    description: 'Закрепите ключевые навыки урока и покажите рабочий результат.',
    learning_goal: 'Применить идею урока в самостоятельном решении.',
    work_steps: 'Прочитай задание.\nСделай решение.\nПроверь результат перед отправкой.',
    success_criteria: 'Решение связано с темой урока.\nЕсть корректный итоговый результат.',
    resources: 'Конспект урока.\nПримеры из практики.',
    submission_format: 'mixed',
  },
  mini_project: {
    label: 'Мини-проект',
    short: 'Небольшой проект с ссылкой на результат.',
    title: 'Мини-проект',
    description: 'Создайте небольшой проект по теме и опишите архитектуру решения.',
    learning_goal: 'Научиться собирать задачу в цельный проект и презентовать результат.',
    work_steps: 'Определи идею проекта.\nСобери рабочую версию.\nПодготовь короткую презентацию.',
    success_criteria: 'Проект запускается или читается без пояснений.\nЕсть описание, как это работает.',
    resources: 'Репозиторий примеров.\nШаблоны интерфейса/кода.',
    submission_format: 'link',
  },
  quiz: {
    label: 'Квиз / тест',
    short: 'Проверка теории и логики по теме.',
    title: 'Квиз по теме',
    description: 'Пройдите контрольный мини-тест и аргументируйте сложные ответы.',
    learning_goal: 'Проверить понимание терминов и базовой логики темы.',
    work_steps: 'Ответь на вопросы.\nПроверь спорные пункты.\nДобавь короткие пояснения.',
    success_criteria: 'Большинство ответов верные.\nПояснения логичные и по теме.',
    resources: 'Конспект урока.\nСловарь терминов.',
    submission_format: 'text',
  },
  reflection: {
    label: 'Рефлексия',
    short: 'Разбор результата и план улучшений.',
    title: 'Рефлексия по теме',
    description: 'Сформулируйте, что получилось, что вызвало сложности и как улучшить результат.',
    learning_goal: 'Развить навык анализа собственной работы.',
    work_steps: 'Опиши, что сделал.\nВыдели сложные моменты.\nПредложи следующий шаг.',
    success_criteria: 'Есть честный разбор.\nЕсть конкретный план улучшений.',
    resources: 'Личный конспект.\nОбратная связь учителя.',
    submission_format: 'text',
  },
}

const ASSIGNMENT_TYPES: AssignmentType[] = ['lesson_practice', 'mini_project', 'quiz', 'reflection']

const SUBMISSION_FORMAT_OPTIONS: Array<{ value: SubmissionFormat; label: string }> = [
  { value: 'text', label: 'Текст' },
  { value: 'code', label: 'Код' },
  { value: 'link', label: 'Ссылка' },
  { value: 'mixed', label: 'Свободный формат' },
]

const SUBMISSION_FORMAT_LABELS: Record<SubmissionFormat, string> = {
  text: 'Текст',
  code: 'Код',
  link: 'Ссылка',
  mixed: 'Свободный формат',
}

const EMPTY_ASSIGNMENT_FORM: AssignmentFormState = {
  title: '',
  description: '',
  lesson_id: '',
  due_date: '',
  difficulty: 'medium',
  xp_reward: '80',
  assignment_type: 'lesson_practice',
  submission_format: ASSIGNMENT_TEMPLATES.lesson_practice.submission_format,
  learning_goal: '',
  work_steps: '',
  success_criteria: '',
  resources: '',
}

const EMPTY_LESSON_FORM = {
  title: '',
  summary: '',
  theory_text: '',
  key_points: '',
  interactive_steps: '',
  task_title: '',
  task_prompt: '',
  answer_keywords: '',
  starter_code: '',
  task_hints: '',
  age_group: 'middle',
  duration_minutes: '10',
  passing_score: '70',
  task_xp_reward: '30',
}

export function TeacherWorkspace() {
  const [overview, setOverview] = useState<TeacherOverviewData | null>(null)
  const [catalog, setCatalog] = useState<LessonCatalogItem[]>([])
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null)
  const [classDetail, setClassDetail] = useState<TeacherClassDetail | null>(null)
  const [assignmentRows, setAssignmentRows] = useState<AssignmentItem[]>([])
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<number | null>(null)
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([])
  const [message, setMessage] = useState('')
  const [classForm, setClassForm] = useState({ name: '', description: '' })
  const [assignmentForm, setAssignmentForm] = useState<AssignmentFormState>(EMPTY_ASSIGNMENT_FORM)
  const [lessonForm, setLessonForm] = useState(EMPTY_LESSON_FORM)

  const selectedClass = useMemo<ClassroomItem | undefined>(
    () => overview?.classes.find((item) => item.id === selectedClassId),
    [overview, selectedClassId],
  )
  const teacherLessons = useMemo(
    () => catalog.filter((lesson) => lesson.source === 'teacher'),
    [catalog],
  )
  const selectedLessonForAssignment = useMemo(
    () => catalog.find((lesson) => String(lesson.id) === assignmentForm.lesson_id) || null,
    [catalog, assignmentForm.lesson_id],
  )

  function patchAssignmentStats(assignmentId: number, rows: SubmissionItem[]) {
    setAssignmentRows((current) => current.map((assignment) => (
      assignment.id === assignmentId
        ? {
            ...assignment,
            submissions_count: rows.length,
            checked_count: rows.filter((item) => item.status === 'checked').length,
          }
        : assignment
    )))
  }

  function applyAssignmentTemplate(type: AssignmentType, replaceFilledFields = false) {
    const template = ASSIGNMENT_TEMPLATES[type]
    const lessonAwareTitle = type === 'lesson_practice' && selectedLessonForAssignment
      ? `Задание по уроку: ${selectedLessonForAssignment.title}`
      : template.title
    const lessonAwareDescription = type === 'lesson_practice' && selectedLessonForAssignment
      ? selectedLessonForAssignment.summary
      : template.description

    setAssignmentForm((current) => {
      const useTemplate = (value: string) => replaceFilledFields || !value.trim()
      return {
        ...current,
        assignment_type: type,
        submission_format: template.submission_format,
        title: useTemplate(current.title) ? lessonAwareTitle : current.title,
        description: useTemplate(current.description) ? lessonAwareDescription : current.description,
        learning_goal: useTemplate(current.learning_goal) ? template.learning_goal : current.learning_goal,
        work_steps: useTemplate(current.work_steps) ? template.work_steps : current.work_steps,
        success_criteria: useTemplate(current.success_criteria) ? template.success_criteria : current.success_criteria,
        resources: useTemplate(current.resources) ? template.resources : current.resources,
      }
    })
  }

  function selectLessonForAssignment(lesson: LessonCatalogItem) {
    setAssignmentForm((current) => ({
      ...current,
      assignment_type: 'lesson_practice',
      submission_format: ASSIGNMENT_TEMPLATES.lesson_practice.submission_format,
      lesson_id: String(lesson.id),
      title: current.title || `Задание по уроку: ${lesson.title}`,
      description: current.description || lesson.summary,
      learning_goal: current.learning_goal || ASSIGNMENT_TEMPLATES.lesson_practice.learning_goal,
      work_steps: current.work_steps || ASSIGNMENT_TEMPLATES.lesson_practice.work_steps,
      success_criteria: current.success_criteria || ASSIGNMENT_TEMPLATES.lesson_practice.success_criteria,
    }))
  }

  async function loadOverview() {
    const data = await api<TeacherOverviewData>('/teacher/overview', undefined, true)
    setOverview(data)
    if (!selectedClassId && data.classes[0]) {
      setSelectedClassId(data.classes[0].id)
    }
  }

  async function loadCatalog(classroomId: number) {
    const data = await api<{ lessons: LessonCatalogItem[] }>(`/teacher/lesson-catalog?classroom_id=${classroomId}`, undefined, true)
    setCatalog(data.lessons)
  }

  async function loadClassDetails(classroomId: number) {
    const [detail, assignments, nextOverview] = await Promise.all([
      api<TeacherClassDetail>(`/teacher/classes/${classroomId}`, undefined, true),
      api<{ assignments: AssignmentItem[] }>(`/teacher/classes/${classroomId}/assignments`, undefined, true),
      api<TeacherOverviewData>('/teacher/overview', undefined, true),
    ])
    setClassDetail(detail)
    setAssignmentRows(assignments.assignments)
    setOverview(nextOverview)
    setSelectedAssignmentId((current) => {
      if (current && assignments.assignments.some((item) => item.id === current)) {
        return current
      }
      return assignments.assignments[0]?.id ?? null
    })
  }

  async function loadSubmissions(assignmentId: number) {
    const [data, nextOverview] = await Promise.all([
      api<{ assignment: AssignmentItem; submissions: SubmissionItem[] }>(`/teacher/assignments/${assignmentId}/submissions`, undefined, true),
      api<TeacherOverviewData>('/teacher/overview', undefined, true),
    ])
    setSubmissions(data.submissions)
    patchAssignmentStats(assignmentId, data.submissions)
    setOverview(nextOverview)
  }

  useEffect(() => {
    loadOverview().catch(() => setMessage('Не удалось загрузить кабинет учителя. Проверьте авторизацию и попробуйте снова.'))
  }, [])

  useEffect(() => {
    if (!selectedClassId) {
      setCatalog([])
      setClassDetail(null)
      setAssignmentRows([])
      setSelectedAssignmentId(null)
      return
    }
    Promise.all([loadClassDetails(selectedClassId), loadCatalog(selectedClassId)]).catch(() => {
      setMessage('Не удалось загрузить уроки и задания выбранного класса.')
    })
  }, [selectedClassId])

  useEffect(() => {
    if (selectedAssignmentId) {
      loadSubmissions(selectedAssignmentId).catch(() => setSubmissions([]))
      return
    }
    setSubmissions([])
  }, [selectedAssignmentId])

  async function createClass(event: FormEvent) {
    event.preventDefault()
    await api('/teacher/classes', { method: 'POST', body: JSON.stringify(classForm) }, true)
    setClassForm({ name: '', description: '' })
    setMessage('Класс создан.')
    await loadOverview()
  }

  async function createLesson(event: FormEvent) {
    event.preventDefault()
    if (!selectedClassId) return
    const data = await api<{ lesson: { id: number; title: string; summary: string } }>(
      `/teacher/classes/${selectedClassId}/lessons`,
      {
        method: 'POST',
        body: JSON.stringify({
          ...lessonForm,
          duration_minutes: Number(lessonForm.duration_minutes),
          passing_score: Number(lessonForm.passing_score),
          task_xp_reward: Number(lessonForm.task_xp_reward),
        }),
      },
      true,
    )
    setLessonForm(EMPTY_LESSON_FORM)
    setAssignmentForm((current) => ({
      ...current,
      assignment_type: 'lesson_practice',
      submission_format: ASSIGNMENT_TEMPLATES.lesson_practice.submission_format,
      lesson_id: String(data.lesson.id),
      title: current.title || `Задание по уроку: ${data.lesson.title}`,
      description: current.description || data.lesson.summary,
      learning_goal: current.learning_goal || ASSIGNMENT_TEMPLATES.lesson_practice.learning_goal,
      work_steps: current.work_steps || ASSIGNMENT_TEMPLATES.lesson_practice.work_steps,
      success_criteria: current.success_criteria || ASSIGNMENT_TEMPLATES.lesson_practice.success_criteria,
    }))
    setMessage('Авторский урок создан. Его уже можно назначить классу.')
    await Promise.all([loadCatalog(selectedClassId), loadClassDetails(selectedClassId)])
  }

  async function createAssignment(event: FormEvent) {
    event.preventDefault()
    if (!selectedClassId) return
    await api(
      `/teacher/classes/${selectedClassId}/assignments`,
      {
        method: 'POST',
        body: JSON.stringify({
          ...assignmentForm,
          lesson_id: assignmentForm.lesson_id ? Number(assignmentForm.lesson_id) : null,
          xp_reward: Number(assignmentForm.xp_reward),
        }),
      },
      true,
    )
    setAssignmentForm((current) => ({
      ...EMPTY_ASSIGNMENT_FORM,
      assignment_type: current.assignment_type,
      submission_format: current.submission_format,
      lesson_id: current.lesson_id,
    }))
    setMessage('Задание назначено классу.')
    await loadClassDetails(selectedClassId)
  }

  async function gradeSubmission(submissionId: number, currentScore: number, currentFeedback?: string | null) {
    await api(
      `/teacher/submissions/${submissionId}/grade`,
      {
        method: 'PATCH',
        body: JSON.stringify({ score: currentScore, feedback: currentFeedback || 'Проверено учителем.', status: 'checked' }),
      },
      true,
    )
    setMessage('Проверка сохранена.')
    if (selectedAssignmentId) {
      await loadSubmissions(selectedAssignmentId)
    }
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
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedClassId(item.id)}
                  className={`w-full rounded-2xl border px-4 py-4 text-left ${selectedClassId === item.id ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-800'}`}
                >
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

          <form onSubmit={createLesson} className="codequest-card p-6">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-600">Свой урок</p>
            <h3 className="mt-2 text-2xl font-black text-slate-900">Создать урок для этого класса</h3>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Название урока" value={lessonForm.title} onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })} />
              <select className="rounded-2xl border border-slate-200 px-4 py-3" value={lessonForm.age_group} onChange={(e) => setLessonForm({ ...lessonForm, age_group: e.target.value })}>
                <option value="junior">junior</option>
                <option value="middle">middle</option>
                <option value="senior">senior</option>
              </select>
              <textarea className="min-h-24 rounded-2xl border border-slate-200 px-4 py-3 md:col-span-2" placeholder="Краткое описание урока" value={lessonForm.summary} onChange={(e) => setLessonForm({ ...lessonForm, summary: e.target.value })} />
              <textarea className="min-h-32 rounded-2xl border border-slate-200 px-4 py-3 md:col-span-2" placeholder="Объяснение темы" value={lessonForm.theory_text} onChange={(e) => setLessonForm({ ...lessonForm, theory_text: e.target.value })} />
              <textarea className="min-h-24 rounded-2xl border border-slate-200 px-4 py-3" placeholder="Ключевые идеи" value={lessonForm.key_points} onChange={(e) => setLessonForm({ ...lessonForm, key_points: e.target.value })} />
              <textarea className="min-h-24 rounded-2xl border border-slate-200 px-4 py-3" placeholder="Шаги разбора" value={lessonForm.interactive_steps} onChange={(e) => setLessonForm({ ...lessonForm, interactive_steps: e.target.value })} />
              <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Название практики" value={lessonForm.task_title} onChange={(e) => setLessonForm({ ...lessonForm, task_title: e.target.value })} />
              <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Ключевые слова ответа" value={lessonForm.answer_keywords} onChange={(e) => setLessonForm({ ...lessonForm, answer_keywords: e.target.value })} />
              <textarea className="min-h-24 rounded-2xl border border-slate-200 px-4 py-3 md:col-span-2" placeholder="Формулировка практического задания" value={lessonForm.task_prompt} onChange={(e) => setLessonForm({ ...lessonForm, task_prompt: e.target.value })} />
              <textarea className="min-h-28 rounded-2xl border border-slate-200 px-4 py-3 md:col-span-2" placeholder="Стартовый код или шаблон ответа" value={lessonForm.starter_code} onChange={(e) => setLessonForm({ ...lessonForm, starter_code: e.target.value })} />
              <textarea className="min-h-24 rounded-2xl border border-slate-200 px-4 py-3 md:col-span-2" placeholder="Подсказки" value={lessonForm.task_hints} onChange={(e) => setLessonForm({ ...lessonForm, task_hints: e.target.value })} />
              <div className="grid grid-cols-3 gap-3 md:col-span-2">
                <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Минуты" value={lessonForm.duration_minutes} onChange={(e) => setLessonForm({ ...lessonForm, duration_minutes: e.target.value })} />
                <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Порог %" value={lessonForm.passing_score} onChange={(e) => setLessonForm({ ...lessonForm, passing_score: e.target.value })} />
                <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="XP за практику" value={lessonForm.task_xp_reward} onChange={(e) => setLessonForm({ ...lessonForm, task_xp_reward: e.target.value })} />
              </div>
            </div>
            <button disabled={!selectedClassId} className="mt-4 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Создать урок</button>
          </form>

          <section className="codequest-card p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-600">Уроки класса</p>
                <h3 className="mt-2 text-2xl font-black text-slate-900">Библиотека + авторские уроки</h3>
              </div>
              <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">{catalog.length} уроков доступно</span>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {catalog.map((lesson) => (
                <div key={lesson.id} className={`rounded-2xl border p-4 ${lesson.source === 'teacher' ? 'border-emerald-200 bg-emerald-50/60' : 'border-slate-200 bg-slate-50'}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-black text-slate-900">{lesson.title}</p>
                      <p className="mt-1 text-sm text-slate-500">{lesson.module_title}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${lesson.source === 'teacher' ? 'bg-white text-emerald-700' : 'bg-white text-sky-700'}`}>{lesson.source_label}</span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{lesson.summary}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button type="button" onClick={() => selectLessonForAssignment(lesson)} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
                      Выбрать для задания
                    </button>
                    <Link href={`/lessons/${lesson.id}`} className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                      Открыть урок
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {teacherLessons.length === 0 && (
              <p className="mt-4 text-sm text-slate-500">Пока нет авторских уроков. Создайте первый урок выше.</p>
            )}
          </section>
          <form onSubmit={createAssignment} className="codequest-card p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-600">Назначить задание</p>
                <h3 className="mt-2 text-2xl font-black text-slate-900">Конструктор заданий</h3>
              </div>
              <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">3 шага: тип → параметры → критерии</span>
            </div>

            <p className="mt-5 text-sm font-bold uppercase tracking-[0.18em] text-slate-500">1. Вид задания</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {ASSIGNMENT_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setAssignmentForm((current) => ({
                    ...current,
                    assignment_type: type,
                    submission_format: ASSIGNMENT_TEMPLATES[type].submission_format,
                  }))}
                  className={`rounded-2xl border p-4 text-left transition ${assignmentForm.assignment_type === type ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                >
                  <p className="text-base font-black text-slate-900">{ASSIGNMENT_TEMPLATES[type].label}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{ASSIGNMENT_TEMPLATES[type].short}</p>
                </button>
              ))}
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <p className="font-semibold text-slate-800">Выбран тип: {ASSIGNMENT_TEMPLATES[assignmentForm.assignment_type].label}</p>
              <p className="mt-1">Рекомендованный формат сдачи: {SUBMISSION_FORMAT_LABELS[assignmentForm.submission_format]}</p>
              {selectedLessonForAssignment && <p className="mt-1">Привязан урок: {selectedLessonForAssignment.title}</p>}
            </div>

            <p className="mt-6 text-sm font-bold uppercase tracking-[0.18em] text-slate-500">2. Основные параметры</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Название задания" value={assignmentForm.title} onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })} />
              <select className="rounded-2xl border border-slate-200 px-4 py-3" value={assignmentForm.lesson_id} onChange={(e) => setAssignmentForm({ ...assignmentForm, lesson_id: e.target.value })}>
                <option value="">Без привязки к уроку</option>
                {catalog.map((lesson) => (
                  <option key={lesson.id} value={lesson.id}>
                    [{lesson.source === 'teacher' ? 'Ваш урок' : 'Каталог'}] {lesson.title}
                  </option>
                ))}
              </select>
              <input className="rounded-2xl border border-slate-200 px-4 py-3" type="date" value={assignmentForm.due_date} onChange={(e) => setAssignmentForm({ ...assignmentForm, due_date: e.target.value })} />
              <div className="grid grid-cols-3 gap-3">
                <select className="rounded-2xl border border-slate-200 px-4 py-3" value={assignmentForm.difficulty} onChange={(e) => setAssignmentForm({ ...assignmentForm, difficulty: e.target.value as Difficulty })}>
                  <option value="easy">easy</option>
                  <option value="medium">medium</option>
                  <option value="hard">hard</option>
                </select>
                <select className="rounded-2xl border border-slate-200 px-4 py-3" value={assignmentForm.submission_format} onChange={(e) => setAssignmentForm({ ...assignmentForm, submission_format: e.target.value as SubmissionFormat })}>
                  {SUBMISSION_FORMAT_OPTIONS.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
                <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="XP" value={assignmentForm.xp_reward} onChange={(e) => setAssignmentForm({ ...assignmentForm, xp_reward: e.target.value })} />
              </div>
            </div>

            <p className="mt-6 text-sm font-bold uppercase tracking-[0.18em] text-slate-500">3. Содержание и ожидания</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <textarea className="min-h-24 rounded-2xl border border-slate-200 px-4 py-3" placeholder="Цель обучения" value={assignmentForm.learning_goal} onChange={(e) => setAssignmentForm({ ...assignmentForm, learning_goal: e.target.value })} />
              <textarea className="min-h-24 rounded-2xl border border-slate-200 px-4 py-3" placeholder="Материалы и ссылки (каждая строка отдельно)" value={assignmentForm.resources} onChange={(e) => setAssignmentForm({ ...assignmentForm, resources: e.target.value })} />
              <textarea className="min-h-28 rounded-2xl border border-slate-200 px-4 py-3" placeholder="Шаги выполнения (каждый шаг с новой строки)" value={assignmentForm.work_steps} onChange={(e) => setAssignmentForm({ ...assignmentForm, work_steps: e.target.value })} />
              <textarea className="min-h-28 rounded-2xl border border-slate-200 px-4 py-3" placeholder="Критерии успеха (каждый пункт с новой строки)" value={assignmentForm.success_criteria} onChange={(e) => setAssignmentForm({ ...assignmentForm, success_criteria: e.target.value })} />
              <textarea className="min-h-28 rounded-2xl border border-slate-200 px-4 py-3 md:col-span-2" placeholder="Описание задания" value={assignmentForm.description} onChange={(e) => setAssignmentForm({ ...assignmentForm, description: e.target.value })} />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={() => applyAssignmentTemplate(assignmentForm.assignment_type, true)} className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
                Заполнить шаблон под выбранный тип
              </button>
              <button type="button" onClick={() => applyAssignmentTemplate(assignmentForm.assignment_type)} className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                Дополнить пустые поля
              </button>
              <button disabled={!selectedClassId} className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Добавить задание</button>
            </div>
          </form>

          <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="codequest-card p-6">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-600">Задания класса</p>
              <div className="mt-4 space-y-3">
                {assignmentRows.map((assignment) => (
                  <button key={assignment.id} type="button" onClick={() => setSelectedAssignmentId(assignment.id)} className={`w-full rounded-2xl border px-4 py-4 text-left ${selectedAssignmentId === assignment.id ? 'border-sky-600 bg-sky-50' : 'border-slate-200 bg-white'}`}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-slate-900">{assignment.title}</p>
                        <p className="mt-1 text-sm text-slate-500">{assignment.assignment_type_label} · {assignment.difficulty} · дедлайн {assignment.due_date || 'без срока'}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {assignment.lesson && <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-sky-700">{assignment.lesson.title}</span>}
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">{SUBMISSION_FORMAT_LABELS[assignment.submission_format]}</span>
                      </div>
                    </div>
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
