'use client'

import { useEffect, useState } from 'react'
import { THEME_STORAGE_KEY } from '@/lib/constants'
import { getIcon, IconName, ICON_SIZES } from '@/lib/utils/icon-utils'
import { Button } from '@/components/ui/Button/Button'

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as 'light' | 'dark' | null
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    const initialTheme = (savedTheme === 'light' || savedTheme === 'dark') ? savedTheme : systemTheme
    setTheme(initialTheme)
    document.documentElement.setAttribute('data-theme', initialTheme)
  }, [mounted])

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
    localStorage.setItem(THEME_STORAGE_KEY, newTheme)
  }

  const LightIcon = getIcon('check' as IconName)
  const DarkIcon = getIcon('x' as IconName)

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="sm"
        aria-label="Toggle theme"
        disabled
      >
        <LightIcon size={ICON_SIZES[1]} />
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      aria-label="Toggle theme"
    >
      {theme === 'light' ? <LightIcon size={ICON_SIZES[1]} /> : <DarkIcon size={ICON_SIZES[1]} />}
    </Button>
  )
}
