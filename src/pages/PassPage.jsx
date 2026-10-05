import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import PassCard from '../components/PassCard'
import PublicModuleNav from '../components/PublicModuleNav'
import PtwPdfPreview from '../components/ptw/PtwPdfPreview'
import { getPublicPass, passUrl } from '../lib/passes'
import { downloadPtwPdf, ptwPdfBlob, publicPassPdfModel } from '../lib/ptwPdf'

export default function PassPage() {
  const { kind, token } = useParams()
  const [pass, setPass] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getPublicPass(kind, token)
      .then((data) => {
        if (cancelled) return
        if (!data) setError('Barcode tidak ditemukan.')
        else setPass(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Tidak dapat membuka barcode.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [kind, token])

  const showSheet = pass?.kind === 'ptw' && pass?.status === 'Approved'

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 via-white to-white">
      <PublicModuleNav />
      <div className={`mx-auto flex flex-col items-center px-4 py-10 ${showSheet ? 'max-w-3xl' : 'max-w-xl'}`}>
        {loading && <p className="text-sm text-slate-500">Memuat barcode…</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {pass && <PassCard pass={pass} url={passUrl(kind, token)} />}
        {showSheet && <ApprovedSheet pass={pass} />}
      </div>
    </div>
  )
}

function ApprovedSheet({ pass }) {
  const model = useMemo(() => publicPassPdfModel(pass), [pass])
  const [blob, setBlob] = useState(null)
  const [fail, setFail] = useState('')

  useEffect(() => {
    if (!model) return undefined
    let cancelled = false
    ptwPdfBlob(model)
      .then((file) => {
        if (!cancelled) setBlob(file)
      })
      .catch((err) => {
        if (!cancelled) setFail(err.message || 'PDF gagal dibuat.')
      })
    return () => {
      cancelled = true
    }
  }, [model])

  return (
    <section className="mt-6 w-full">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Lembar izin kerja</h2>
          <p className="text-xs text-slate-500">Isian yang sudah disetujui HSSE. FM.HSE.001</p>
        </div>
        {model && (
          <button type="button" className="btn-primary" onClick={() => downloadPtwPdf(model)}>
            Unduh PDF
          </button>
        )}
      </div>
      {!model && (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Permit sudah disetujui, tetapi lembar isian belum ikut terkirim ke halaman ini. Jalankan pembaruan database supaya PDF muncul saat barcode discan.
        </p>
      )}
      {fail && <p className="text-sm text-red-600">{fail}</p>}
      {model && (
        <div className="h-[75vh] overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
          {blob ? <PtwPdfPreview blob={blob} /> : <p className="p-4 text-sm text-slate-500">Menyusun PDF…</p>}
        </div>
      )}
    </section>
  )
}
