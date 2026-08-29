import BrandLogo from './BrandLogo'
import { BRANDING } from '../lib/branding'

export default function BrandHeader({ title, subtitle, size = 'md', className = '' }) {
  return (
    <header className={`flex flex-col items-center text-center ${className}`}>
      <BrandLogo size={size === 'md' ? 'lg' : size} className="mb-3" />
      <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
        {BRANDING.appName}
      </p>
      <p className="mt-0.5 text-[11px] font-medium text-slate-400">{BRANDING.subsidiary}</p>
      {title && <h1 className="mt-3 text-2xl font-bold text-slate-900">{title}</h1>}
      {subtitle && <p className="mt-1 max-w-sm text-sm text-slate-500">{subtitle}</p>}
    </header>
  )
}
