import { useEffect, useRef } from 'react'

const WIDTH = 320
const HEIGHT = 80

export default function SignaturePad({ value, onChange }) {
  const canvasRef = useRef(null)
  const drawing = useRef(false)
  const last = useRef(null)
  const lastExported = useRef('')
  const painted = useRef(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined
    const ctx = canvas.getContext('2d')
    if (!painted.current) {
      painted.current = true
      paintBlank(ctx)
      if (value) drawImage(ctx, value)
      lastExported.current = value || ''
      return undefined
    }
    if (value === lastExported.current) return undefined
    lastExported.current = value || ''
    paintBlank(ctx)
    if (value) drawImage(ctx, value)
    return undefined
  }, [value])

  function exportImage() {
    const canvas = canvasRef.current
    let quality = 0.5
    let data = canvas.toDataURL('image/jpeg', quality)
    while (data.length > 6800 && quality > 0.22) {
      quality = Math.round((quality - 0.08) * 100) / 100
      data = canvas.toDataURL('image/jpeg', quality)
    }
    if (data.length > 7000) {
      lastExported.current = ''
      onChange('')
      return
    }
    lastExported.current = data
    onChange(data)
  }

  function pointerDown(event) {
    const canvas = canvasRef.current
    drawing.current = true
    last.current = point(event, canvas)
    try {
      canvas.setPointerCapture(event.pointerId)
    } catch {
      // Synthetic or already-released pointers can still draw.
    }
  }

  function pointerMove(event) {
    if (!drawing.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const next = point(event, canvas)
    ctx.strokeStyle = '#111827'
    ctx.lineWidth = 2.2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(last.current.x, last.current.y)
    ctx.lineTo(next.x, next.y)
    ctx.stroke()
    last.current = next
  }

  function pointerUp() {
    if (!drawing.current) return
    drawing.current = false
    exportImage()
  }

  function clear() {
    paintBlank(canvasRef.current.getContext('2d'))
    lastExported.current = ''
    onChange('')
  }

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        className="w-full touch-none rounded-xl border border-slate-300 bg-white"
        onPointerDown={pointerDown}
        onPointerMove={pointerMove}
        onPointerUp={pointerUp}
        onPointerCancel={pointerUp}
      />
      <button type="button" onClick={clear} className="mt-1 text-xs font-medium text-slate-500">
        Hapus tanda tangan
      </button>
    </div>
  )
}

function paintBlank(ctx) {
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, WIDTH, HEIGHT)
}

function drawImage(ctx, src) {
  const img = new Image()
  img.onload = () => ctx.drawImage(img, 0, 0, WIDTH, HEIGHT)
  img.src = src
}

function point(event, canvas) {
  const rect = canvas.getBoundingClientRect()
  return {
    x: ((event.clientX - rect.left) / rect.width) * WIDTH,
    y: ((event.clientY - rect.top) / rect.height) * HEIGHT,
  }
}
