import { useState, useLayoutEffect } from 'react'

export type Theme = 'dark' | 'light' | 'win95' | 'minimalistic'
const LS_THEME = 'meshcore-theme'

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(
    () => (localStorage.getItem(LS_THEME) as Theme) || 'dark'
  )

  useLayoutEffect(() => {
    if (theme === 'dark') {
      document.documentElement.removeAttribute('data-theme')
    } else {
      document.documentElement.setAttribute('data-theme', theme)
    }
    localStorage.setItem(LS_THEME, theme)
  }, [theme])

  function setTheme(t: Theme) {
    setThemeState(t)
  }

  return { theme, setTheme }
}
