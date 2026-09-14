/** Batas input sisi klien — selaras dengan validasi upload & form pelapor. */
export const FIELD_LIMITS = {
  name: 120,
  company: 120,
  department: 80,
  location: 200,
  description: 4000,
}

export const PHOTO_MAX_BYTES = 10 * 1024 * 1024
export const PHOTO_MAX_COUNT = 8
export const PHOTO_EXT = new Set(['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'])
export const PHOTO_MIME = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
])

const MIME_EXT = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
}

export function clipText(value, max) {
  return String(value ?? '').slice(0, max)
}

export function validatePhotoFile(file) {
  if (!file || typeof file.size !== 'number') return 'File foto tidak valid.'
  if (file.size > PHOTO_MAX_BYTES) return 'Foto maksimal 10 MB per berkas.'
  const ext = String(file.name || '')
    .split('.')
    .pop()
    .toLowerCase()
  const mime = String(file.type || '').toLowerCase()
  const extOk = PHOTO_EXT.has(ext)
  const mimeOk = PHOTO_MIME.has(mime)
  if (!mimeOk && !extOk) {
    return 'Hanya foto JPG, PNG, WEBP, atau HEIC.'
  }
  if (mime && !mimeOk && mime !== 'application/octet-stream') {
    return 'Hanya foto JPG, PNG, WEBP, atau HEIC.'
  }
  return null
}

export function photoStoragePath(file) {
  const mime = String(file?.type || '').toLowerCase()
  let ext = MIME_EXT[mime]
  if (!ext) {
    const raw = String(file?.name || '')
      .split('.')
      .pop()
      .toLowerCase()
    ext = PHOTO_EXT.has(raw) ? (raw === 'jpeg' ? 'jpg' : raw) : 'jpg'
  }
  const stamp = Date.now()
  const rand = crypto.randomUUID().slice(0, 8)
  return `${stamp}-${rand}.${ext}`
}
