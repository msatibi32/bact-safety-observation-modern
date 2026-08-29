// Branding PT. BACT — file logo di public/logo/

export const BRANDING = {
  shortName: 'BACT',
  fullName: 'Batu Ampar Container Terminal',
  legalName: 'PT. BACT',
  appName: 'Safety Observation Card',
  tagline: 'Pelaporan observasi keselamatan kerja di area terminal',
  subsidiary: 'An ICTSI Group Company',

  // Logo utama (horizontal, orange) — untuk header form & login
  logoSrc: '/logo/bact-logo.png',
  // Versi compact untuk navbar admin
  logoCompactSrc: '/logo/bact-logo-compact.png',
  logoAlt: 'Logo PT. BACT Batu Ampar Container Terminal',

  faviconSrc: '/logo/favicon.png',

  // Warna brand BACT (orange ICTSI)
  colors: {
    orange: '#F37021',
    orangeDark: '#D95E10',
    red: '#C41230',
    black: '#1a1a1a',
  },
}

export function brandTitle(suffix = BRANDING.appName) {
  return `${BRANDING.shortName} · ${suffix}`
}
