import { MoonIcon, SunIcon } from './Icon'
import { useTheme } from '../lib/theme'

export default function ThemeToggle({ compact = false }) {
  const { theme, setTheme } = useTheme()
  const dark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? 'light' : 'dark')}
      className="theme-toggle"
      aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={dark ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      {dark ? <SunIcon className="h-3.5 w-3.5" /> : <MoonIcon className="h-3.5 w-3.5" />}
      {!compact && <span>{dark ? 'Light' : 'Dark'}</span>}
    </button>
  )
}
