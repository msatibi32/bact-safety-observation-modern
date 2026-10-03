// Branding PT. BACT — file logo di public/logo/

export const BRANDING = {
  shortName: 'BACT',
  fullName: 'Batu Ampar Container Terminal',
  legalName: 'PT. BACT',
  appName: 'Safety Observation Card',
  tagline: 'Pelaporan observasi keselamatan kerja di area terminal',
  /** Teks samping logo PDF — tanpa "BACT DAN ICTSI" / ICTSI Group */
  subsidiary: '',
  pdfClosingLine:
    'Demikian laporan observasi keselamatan ini dibuat untuk ditindaklanjuti sesuai prosedur HSSE Batu Ampar Container Terminal.',

  // Logo web ringan (hasil resize) — header form & admin
  logoSrc: '/logo/web-white.png',
  logoCompactSrc: '/logo/web-white.png',
  // Logo huruf hitam — PDF notice (tetap file asli agar tajam di kertas)
  logoPdfSrc: '/logo/BACT Logo_OG Black Text.png',
  logoAlt: 'Logo PT. BACT Batu Ampar Container Terminal',

  faviconSrc: '/logo/favicon-32.png',

  // URL publik form pelapor — untuk QR code (permanent selama URL ini tidak berubah)
  publicUrl:
    import.meta.env.VITE_PUBLIC_APP_URL?.replace(/\/$/, '') ||
    (typeof window !== 'undefined' ? window.location.origin : 'https://bact-safety-observation-modern.vercel.app'),

  // File QR statis (hasil npm run generate:qr)
  staticQrPng: '/qr/bact-soc-qr.png',
  staticQrSvg: '/qr/bact-soc-qr.svg',

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
