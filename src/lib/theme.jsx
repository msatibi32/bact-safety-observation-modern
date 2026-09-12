import { createContext, useContext, useEffect, useMemo, useState } from 'react'

export const THEME_KEY = 'soc_theme'
export const DEFAULT_THEME = 'dark'

export function readStoredTheme() {
  try {
    const value = localStorage.getItem(THEME_KEY)
    return value === 'dark' || value === 'light' ? value : DEFAULT_THEME
  } catch {
    return DEFAULT_THEME
  }
}

export function applyTheme(theme) {
  const next = theme === 'light' ? 'light' : 'dark'
  document.documentElement.setAttribute('data-theme', next)
  document.documentElement.style.colorScheme = next
}

export function chartTheme(theme) {
  if (theme === 'light') {
    return {
      grid: '#e2e8f0',
      tick: '#64748b',
      tickMuted: '#475569',
      tooltip: {
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 12,
        fontSize: 12,
        color: '#0f172a',
      },
      tooltipLabel: { color: '#64748b' },
    }
  }
  return {
    grid: '#1e293b',
    tick: '#64748b',
    tickMuted: '#94a3b8',
    tooltip: {
      background: '#0f172a',
      border: '1px solid #334155',
      borderRadius: 12,
      fontSize: 12,
    },
    tooltipLabel: { color: '#94a3b8' },
  }
}

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(readStoredTheme)

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const setTheme = (next) => {
    const value = next === 'dark' ? 'dark' : 'light'
    setThemeState(value)
    applyTheme(value)
    try {
      localStorage.setItem(THEME_KEY, value)
    } catch {
      /* ignore */
    }
  }

  const value = useMemo(() => ({ theme, setTheme }), [theme])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider')
  return ctx
}

export function useChartTheme() {
  const { theme } = useTheme()
  return useMemo(() => chartTheme(theme), [theme])
}
