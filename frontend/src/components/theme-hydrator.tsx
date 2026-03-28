'use client'

import { useLayoutEffect } from 'react'
import { applyTheme, DEFAULT_THEME, getStoredTheme } from '@/lib/theme'

export function ThemeHydrator() {
  useLayoutEffect(() => {
    applyTheme(getStoredTheme() || DEFAULT_THEME)
  }, [])

  return null
}
