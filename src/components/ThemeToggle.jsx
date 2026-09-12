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
      aria-label={dark ? 'Ganti ke tema terang' : 'Ganti ke tema gelap'}
      title={dark ? 'Ganti ke tema terang' : 'Ganti ke tema gelap'}
    >
      {dark ? <SunIcon className="h-3.5 w-3.5" /> : <MoonIcon className="h-3.5 w-3.5" />}
      {!compact && <span>{dark ? 'Terang' : 'Gelap'}</span>}
    </button>
  )
}
