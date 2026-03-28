import { SiteHeader } from '@/components/site-header'
import Link from 'next/link'

export default function HomePage() {
	return (
		<main>
			<SiteHeader />
			<section className='mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 sm:py-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center'>
				<div>
					<div className='inline-flex rounded-full bg-white px-4 py-2 text-xs font-semibold shadow-sm sm:text-sm'>
						Платформа Кодиумс
					</div>
					<h2 className='mt-6 max-w-4xl text-4xl font-black leading-tight text-slate-900 sm:text-5xl lg:text-6xl'>
						Курсы программирования с понятным учебным маршрутом.
					</h2>
					<p className='mt-6 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8'>
						Платформа объединяет учебные модули по возрастам, теорию,
						практические задачи, тесты, teacher-классы, родительский кабинет и
						административные инструменты.
					</p>
					<div className='mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4'>
						<Link
							href='/auth/register'
							className='inline-flex w-full justify-center rounded-full bg-slate-900 px-6 py-3 font-semibold text-white shadow-xl shadow-slate-300 sm:w-auto'
						>
							Начать бесплатно
						</Link>
						<Link
							href='/roadmap'
							className='inline-flex w-full justify-center rounded-full bg-white px-6 py-3 font-semibold text-slate-900 shadow-md sm:w-auto'
						>
							Смотреть roadmap
						</Link>
						<Link
							href='/parent'
							className='inline-flex w-full justify-center rounded-full bg-violet-100 px-6 py-3 font-semibold text-violet-800 shadow-md sm:w-auto'
						>
							Родительский кабинет
						</Link>
					</div>
					<div className='mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
						{[
							[
								'Теория + практика',
								'Каждый урок даёт понятное объяснение, задачу на закрепление и контрольный квиз.',
							],
							[
								'Кабинет учителя',
								'Учитель создаёт классы, назначает задания и проверяет ответы учеников в одном месте.',
							],
							[
								'Прозрачный прогресс',
								'Ученик и родители видят уровень, XP, статистику и динамику обучения.',
							],
						].map(([title, text]) => (
							<article
								key={title}
								className='rounded-[26px] bg-white/90 p-5 shadow-lg'
							>
								<h3 className='text-lg font-black text-slate-900'>{title}</h3>
								<p className='mt-2 text-sm leading-7 text-slate-600'>{text}</p>
							</article>
						))}
					</div>
				</div>

				<div className='codequest-card grid-bg overflow-hidden p-6 sm:p-8'>
					<p className='text-sm font-bold uppercase tracking-[0.24em] text-sky-600'>
						4 основные роли
					</p>
					<div className='mt-5 grid gap-4'>
						{[
							[
								'Ученик',
								'Проходит roadmap, уроки, практику и тесты, получает XP и собирает достижения.',
							],
							[
								'Учитель',
								'Создаёт классы, раздаёт задания, смотрит ответы и прогресс учеников.',
							],
							[
								'Админ',
								'Управляет публикацией модулей, контентом и общими данными платформы.',
							],
							[
								'Суперадмин',
								'Управляет администраторами и контролирует доступ в админ-контур.',
							],
						].map(([title, text]) => (
							<div
								key={title}
								className='rounded-[24px] border border-white/60 bg-white/80 p-5'
							>
								<h3 className='text-xl font-black text-slate-900'>{title}</h3>
								<p className='mt-2 text-sm leading-7 text-slate-600'>{text}</p>
							</div>
						))}
					</div>
					<div className='mt-6 rounded-[24px] bg-slate-900 p-5 text-white'>
						<p className='text-sm uppercase tracking-[0.2em] text-sky-300'>
							Готово к запуску
						</p>
						<p className='mt-3 text-sm text-slate-200'>
							Интерфейс ориентирован на ежедневное обучение: чёткий маршрут,
							удобная страница урока и рабочие кабинеты для всех ролей.
						</p>
					</div>
				</div>
			</section>
		</main>
	)
}
