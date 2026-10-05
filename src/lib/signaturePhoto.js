const MAX_CHARS = 36000

export function signatureFromPhoto(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(knockOut(img, 520))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Foto tidak bisa dibaca. Pakai JPG atau PNG.'))
    }
    img.src = url
  })
}

function knockOut(img, maxW) {
  const scale = Math.min(1, maxW / img.width)
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(img.width * scale))
  canvas.height = Math.max(1, Math.round(img.height * scale))
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  const frame = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = frame.data
  for (let i = 0; i < data.length; i += 4) {
    if (data[i] > 225 && data[i + 1] > 225 && data[i + 2] > 225) data[i + 3] = 0
  }
  ctx.putImageData(frame, 0, 0)
  const png = canvas.toDataURL('image/png')
  if (png.length <= MAX_CHARS || maxW < 180) return png
  return knockOut(img, Math.round(maxW * 0.7))
}
