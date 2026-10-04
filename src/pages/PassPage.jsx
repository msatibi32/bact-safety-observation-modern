import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import PassCard from '../components/PassCard'
import PublicModuleNav from '../components/PublicModuleNav'
import { getPublicPass, passUrl } from '../lib/passes'

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 via-white to-white">
      <PublicModuleNav />
      <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-10">
        {loading && <p className="text-sm text-slate-500">Memuat barcode…</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {pass && <PassCard pass={pass} url={passUrl(kind, token)} />}
      </div>
    </div>
  )
}
