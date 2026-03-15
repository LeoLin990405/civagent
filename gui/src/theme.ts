import { useState, useEffect } from 'react'

type Theme = 'dark' | 'light'

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    // Prefer boluo_theme (direct theme key), fallback to theme in boluo_settings for consistency
    const saved = localStorage.getItem('boluo_theme')
    if (saved === 'dark' || saved === 'light') return saved
    try {
      const settings = JSON.parse(localStorage.getItem('boluo_settings') || '{}')
      if (settings.theme === 'dark' || settings.theme === 'light') return settings.theme
    } catch {}
    return 'dark'
  })

  useEffect(() => {
    localStorage.setItem('boluo_theme', theme)
    // Keep boluo_settings.theme in sync to avoid desync between the two stores
    try {
      const raw = localStorage.getItem('boluo_settings')
      if (raw) {
        const settings = JSON.parse(raw)
        if (settings.theme !== theme) {
          settings.theme = theme
          localStorage.setItem('boluo_settings', JSON.stringify(settings))
        }
      }
    } catch {}
    document.documentElement.classList.toggle('light', theme === 'light')
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  const toggle = () => setTheme(t => t === 'dark' ? 'light' : 'dark')
  
  return { theme, setTheme, toggle }
}
