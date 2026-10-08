import { useEffect, useState } from 'react'
import { getMySignature, saveMySignature } from '../../lib/passes'
import { signatureFromPhoto } from '../../lib/signaturePhoto'

export default function StaffSignatureCard() {
  const [image, setImage] = useState('')
  const [error, setError] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    getMySignature()
      .then((data) => {
        if (!cancelled) setImage(data?.image || '')
      })
      .catch(() => {
        if (!cancelled) setNote('')
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function onFile(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setBusy(true)
    setError('')
    setNote('')
    try {
      const next = await signatureFromPhoto(file)
      await saveMySignature(next)
      setImage(next)
      setNote('Tersimpan. Foto ini yang ditempel saat Anda menyetujui permit.')
    } catch (err) {
      setError(err.message || 'Foto gagal disimpan.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="admin-panel mb-4 rounded-2xl border border-slate-800 p-4">
      <h2 className="text-sm font-semibold text-slate-100">Foto tanda tangan</h2>
      <p className="mt-1 text-xs text-slate-400">
        Foto tanda tangan di kertas putih, sekali saja. Di lembar PDF, tekan Tempel tanda tangan — foto ini yang masuk, tanpa gambar ulang.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <div className="flex h-16 w-44 items-center justify-center rounded-xl bg-white">
          {image ? <img src={image} alt="Tanda tangan tersimpan" className="max-h-14 max-w-40 object-contain" /> : <span className="text-[11px] text-slate-400">Belum ada</span>}
        </div>
        <label className="cursor-pointer rounded-xl border border-slate-600 px-3 py-2 text-xs font-semibold text-slate-100">
          {busy ? 'Menyimpan…' : 'Unggah foto'}
          <input type="file" accept="image/*" className="hidden" disabled={busy} onChange={onFile} />
        </label>
      </div>
      {note && <p className="mt-2 text-xs text-emerald-300">{note}</p>}
      {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
    </section>
  )
}
