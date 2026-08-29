#!/usr/bin/env node
/**
 * Generate static QR files di public/qr/
 * URL diambil dari VITE_PUBLIC_APP_URL atau default Vercel production.
 *
 * Usage: npm run generate:qr
 *        VITE_PUBLIC_APP_URL=https://soc.bact.co.id npm run generate:qr
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import QRCode from 'qrcode'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.join(__dirname, '../public/qr')

const url =
  process.env.VITE_PUBLIC_APP_URL?.trim() ||
  'https://bact-safety-observation-modern.vercel.app/'

const baseName = 'bact-soc-qr'

async function main() {
  fs.mkdirSync(outDir, { recursive: true })

  await QRCode.toFile(path.join(outDir, `${baseName}.png`), url, {
    width: 1024,
    margin: 2,
    color: { dark: '#1a1a1a', light: '#ffffff' },
  })

  await QRCode.toFile(path.join(outDir, `${baseName}.svg`), url, {
    type: 'svg',
    margin: 2,
    color: { dark: '#1a1a1a', light: '#ffffff' },
  })

  fs.writeFileSync(
    path.join(outDir, 'qr-url.txt'),
    `${url}\nGenerated: ${new Date().toISOString()}\n`,
    'utf8',
  )

  console.log(`QR generated → ${url}`)
  console.log(`Files: public/qr/${baseName}.png, .svg`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
