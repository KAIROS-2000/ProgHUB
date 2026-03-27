'use client'

import { clearTokens, getAccessToken } from '@/lib/storage'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

type UserRole = 'student' | 'teacher' | 'admin' | 'superadmin'

const roleSet = new Set<UserRole>(['student', 'teacher', 'admin', 'superadmin'])

function parseRoleFromToken(token: string): UserRole | null {
	const parts = token.split('.')
	if (parts.length !== 3) return null
	const payloadPart = parts[1]
	if (!payloadPart) return null
	try {
		const normalized = payloadPart.replace(/-/g, '+').replace(/_/g, '/')
		const padding = '='.repeat((4 - (normalized.length % 4)) % 4)
		const payload = JSON.parse(atob(normalized + padding)) as { role?: string }
		if (payload.role && roleSet.has(payload.role as UserRole)) {
			return payload.role as UserRole
		}
	} catch {
		return null
	}
	return null
}

export function SiteHeader() {
	const pathname = usePathname()
	const [token, setToken] = useState('')

	useEffect(() => {
		setToken(getAccessToken())
	}, [pathname])

	const role = useMemo(() => parseRoleFromToken(token), [token])
	const isAuthenticated = Boolean(token)
	const links = useMemo(() => {
		const common = [
			{ href: '/', label: 'Главная' },
			{ href: '/parent', label: 'Родители' },
		]
		if (!isAuthenticated) return common

		const secured = [
			{ href: '/dashboard', label: 'Кабинет' },
			{ href: '/roadmap', label: 'Roadmap' },
			// { href: '/lessons/1', label: 'Урок' },
			{ href: '/leaderboard', label: 'Рейтинг' },
			{ href: '/forum', label: 'Форум' },
			{ href: '/profile', label: 'Профиль' },
		]

		if (role === 'teacher')
			secured.splice(3, 0, { href: '/teacher', label: 'Учитель' })
		if (role === 'admin' || role === 'superadmin')
			secured.splice(3, 0, { href: '/admin', label: 'Админ' })
		if (role === 'superadmin')
			secured.splice(4, 0, { href: '/superadmin', label: 'Суперадмин' })

		return [...common, ...secured]
	}, [isAuthenticated, role])

	return (
		<header className='sticky top-0 z-50 border-b border-white/60 bg-white/70 backdrop-blur-xl'>
			<div className='mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4'>
				<Link href='/' className='flex items-center gap-3'>
					<div className='flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-600 text-lg font-black text-white shadow-lg shadow-sky-200'>
						CQ
					</div>
					<div>
						<p className='text-xs font-bold uppercase tracking-[0.26em] text-sky-600'>
							CodeQuest
						</p>
						<h1 className='text-lg font-black text-slate-900'>
							Обучающая платформа
						</h1>
					</div>
				</Link>

				<nav className='hidden flex-wrap items-center gap-2 xl:flex'>
					{links.map(link => {
						const isActive =
							pathname === link.href ||
							(link.href !== '/' && pathname?.startsWith(link.href))
						return (
							<Link
								key={link.href}
								href={link.href}
								className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
									isActive
										? 'bg-slate-900 text-white'
										: 'bg-white text-slate-700 shadow-sm'
								}`}
							>
								{link.label}
							</Link>
						)
					})}
				</nav>

				<div className='flex items-center gap-3'>
					{isAuthenticated ? (
						<button
							className='rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white'
							onClick={() => {
								clearTokens()
								window.location.href = '/auth/login'
							}}
						>
							Выйти
						</button>
					) : (
						<>
							<Link
								href='/auth/login'
								className='rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm'
							>
								Войти
							</Link>
							<Link
								href='/auth/register'
								className='rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white'
							>
								Регистрация
							</Link>
						</>
					)}
				</div>
			</div>
		</header>
	)
}
