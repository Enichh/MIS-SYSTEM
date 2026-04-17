'use client'

import { useEffect, useState } from 'react'
import { THEME_STORAGE_KEY } from '@/lib/constants'
import { SunIcon } from '@/app/components/ui/icons/custom/SunIcon'
import { MoonIcon } from '@/app/components/ui/icons/custom/MoonIcon'
import { Button } from '@/app/components/ui/Button/Button'

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
    document.documentElement.classList.toggle('dark', initialTheme === 'dark')
  }, [mounted])

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
    localStorage.setItem(THEME_STORAGE_KEY, newTheme)
  }

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="sm"
        aria-label="Toggle theme"
        disabled
      >
        <SunIcon size={20} />
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
      {theme === 'light' ? <SunIcon size={20} /> : <MoonIcon size={20} />}
    </Button>
  )
}
