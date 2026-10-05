import { useEffect, useRef, useState } from 'react'
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

GlobalWorkerOptions.workerSrc = workerUrl

export default function PtwPdfPreview({ blob }) {
  const frameRef = useRef(null)
  const canvasRef = useRef(null)
  const [pages, setPages] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!blob) return undefined
    let cancel = false
    let loading
    const start = blob.arrayBuffer().then((buffer) => {
      loading = getDocument({ data: new Uint8Array(buffer) })
      return paint()
    })

    async function paint() {
      const pdf = await loading.promise
      if (cancel) return
      setPages(pdf.numPages)
      const page = await pdf.getPage(1)
      const canvas = canvasRef.current
      const frame = frameRef.current
      if (!canvas || !frame || cancel) return
      const base = page.getViewport({ scale: 1 })
      const scale = Math.min(
        (frame.clientWidth - 12) / base.width,
        (frame.clientHeight - 12) / base.height,
      )
      const viewport = page.getViewport({ scale: Math.max(scale, 0.2) })
      canvas.width = Math.floor(viewport.width)
      canvas.height = Math.floor(viewport.height)
      await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise
    }

    start.catch((err) => {
      if (!cancel) setError(err?.message || 'Preview gagal dibuat.')
    })

    return () => {
      cancel = true
      loading?.destroy()
    }
  }, [blob])

  return (
    <div ref={frameRef} className="flex h-full items-center justify-center overflow-hidden">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <canvas ref={canvasRef} className="bg-white shadow-xl" />
      {pages > 1 ? (
        <p className="absolute bottom-4 right-4 rounded bg-red-600 px-2 py-1 text-xs text-white">{pages} halaman</p>
      ) : null}
    </div>
  )
}
