import { useState } from 'react'
import { ShieldIcon } from './Icon'
import { BRANDING } from '../lib/branding'

const SIZE = {
  sm: { box: 'h-9 px-2', img: 'h-7 max-w-[100px]' },
  md: { box: 'h-16 px-3', img: 'h-12 max-w-[220px]' },
  lg: { box: 'h-20 px-4', img: 'h-14 max-w-[280px]' },
}

export default function BrandLogo({ size = 'md', compact = false, className = '' }) {
  const [failed, setFailed] = useState(false)
  const dim = SIZE[size] ?? SIZE.md
  const src = compact ? BRANDING.logoCompactSrc : BRANDING.logoSrc

  if (failed) {
    return (
      <div
        className={`flex ${dim.box} items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-500 text-white ${className}`}
      >
        <ShieldIcon className={size === 'sm' ? 'h-5 w-5' : 'h-7 w-7'} />
      </div>
    )
  }

  return (
    <div
      className={`flex items-center justify-center rounded-xl bg-black ${dim.box} ${className}`}
    >
      <img
        src={src}
        alt={BRANDING.logoAlt}
        onError={() => setFailed(true)}
        className={`${dim.img} w-auto object-contain`}
      />
    </div>
  )
}
