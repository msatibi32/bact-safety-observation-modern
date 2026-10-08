import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { HiPoBadge, RiskBadge, StatusBadge } from './Badge'
import RecommendationPanel from './RecommendationPanel'
import { BuildingIcon, PinIcon } from './Icon'
import { assignableDepartmentHeads } from '../data/departmentHeads'
import {
  KATEGORI_OPTIONS,
  RISIKO_OPTIONS,
  STATUS_OPTIONS,
  capaMode,
  capaModeNote,
  categoryLabel,
  computeIsHiPo,
  isUnclassifiedCategory,
  isUnclassifiedObservation,
  isUnclassifiedRisk,
} from '../lib/constants'
import {
  buildSummary5W1H,
  investigationPlainSummary,
  parseInvestigationData,
} from '../lib/investigation'
import { buildNoticeActions } from '../lib/pdfNarrative'
import { buildPdfSubject, normalizeActionChecks } from '../lib/pdfMeta'
import { canClassifyObservations, canEditObservations, isSuperAdmin, visibleEmployeeId, visibleReporterName } from '../lib/roles'
import { queueFollowUpEmail, randomToken } from '../lib/passes'
import { resolveSocNumber } from '../lib/socNumber'
import { useUser } from './RequireRole'

const PdfReviewModal = lazy(() => import('./PdfReviewModal'))

const TABS = ['Detail', 'Recommendation']

export default function ObservationDetailPanel({ observation, onSave, allObservations = [] }) {
  const user = useUser()
  const canEdit = canEditObservations(user)
  const canClassify = canClassifyObservations(user)
  const revealReporter = isSuperAdmin(user)
  const reporterName = visibleReporterName(observation, user)
  const reporterId = visibleEmployeeId(observation, user)
  const pendingClass = isUnclassifiedObservation(observation)
  const [tab, setTab] = useState('Detail')
  const [pic, setPic] = useState(observation.pic_assigned || '')
  const [assigneeId, setAssigneeId] = useState('')
  const [linkNote, setLinkNote] = useState('')
  const [status, setStatus] = useState(observation.status)
  const [kategori, setKategori] = useState(isUnclassifiedCategory(observation.kategori) ? '' : observation.kategori)
  const [risiko, setRisiko] = useState(isUnclassifiedRisk(observation.tingkat_risiko) ? '' : observation.tingkat_risiko)
  const [catatan, setCatatan] = useState(observation.catatan_penutupan || '')
  const [triageNotes, setTriageNotes] = useState(observation.triage_notes || '')
  const [verificationNotes, setVerificationNotes] = useState(observation.verification_notes || '')
  const [requiresInvestigation, setRequiresInvestigation] = useState(
    Boolean(observation.requires_investigation),
  )
  const [pdfTo, setPdfTo] = useState(observation.pdf_to || '')
  const [pdfPic, setPdfPic] = useState(observation.pdf_pic || '')
  const [pdfSubject, setPdfSubject] = useState(observation.pdf_subject || '')
  const [actionChecks, setActionChecks] = useState(() =>
    normalizeActionChecks(buildNoticeActions(observation).id.length, observation.pdf_action_checks),
  )
  const [inv, setInv] = useState(() => parseInvestigationData(observation))
  const [finding, setFinding] = useState(observation.finding_observation || '')
  const [recommendation, setRecommendation] = useState(observation.rekomendasi || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [pdfReview, setPdfReview] = useState(null)

  const socNo = resolveSocNumber(observation, allObservations)
  const noticeActions = useMemo(
    () =>
      buildNoticeActions({
        ...observation,
        pic_assigned: pic,
        finding_observation: finding,
        rekomendasi: recommendation,
        triage_notes: triageNotes,
        requires_investigation: requiresInvestigation,
        catatan_penutupan: catatan,
      }),
    [observation, pic, finding, recommendation, triageNotes, requiresInvestigation, catatan],
  )

  useEffect(() => {
    setActionChecks((prev) => normalizeActionChecks(noticeActions.id.length, prev))
  }, [noticeActions.id.length])

  useEffect(() => {
    setPic(observation.pic_assigned || '')
    setAssigneeId('')
    setStatus(observation.status)
    setKategori(isUnclassifiedCategory(observation.kategori) ? '' : observation.kategori)
    setRisiko(isUnclassifiedRisk(observation.tingkat_risiko) ? '' : observation.tingkat_risiko)
    setCatatan(observation.catatan_penutupan || '')
    setTriageNotes(observation.triage_notes || '')
    setVerificationNotes(observation.verification_notes || '')
    setRequiresInvestigation(Boolean(observation.requires_investigation))
    setPdfTo(observation.pdf_to || '')
    setPdfPic(observation.pdf_pic || '')
    setPdfSubject(observation.pdf_subject || '')
    setActionChecks(
      normalizeActionChecks(buildNoticeActions(observation).id.length, observation.pdf_action_checks),
    )
    setInv(parseInvestigationData(observation))
    setFinding(observation.finding_observation || '')
    setRecommendation(observation.rekomendasi || '')
  }, [observation])

  async function persist(patchExtra = {}) {
    setError('')
    if (canClassify && (kategori ? !risiko : Boolean(risiko))) {
      setError('Set category and risk together.')
      return false
    }
    setSaving(true)
    try {
      const invPayload = {
        ...inv,
        summary_5w1h: inv.summary_5w1h || buildSummary5W1H(inv),
      }
      const patch = {
        pic_assigned: pic,
        status,
        catatan_penutupan: catatan,
        triage_notes: triageNotes,
        verification_notes: verificationNotes,
        requires_investigation: requiresInvestigation,
        pdf_to: pdfTo,
        pdf_pic: pdfPic,
        pdf_subject: pdfSubject,
        pdf_action_checks: actionChecks,
        investigation_data: invPayload,
        investigation_notes: investigationPlainSummary(invPayload),
        root_cause: invPayload.root_cause || '',
        investigator_name: invPayload.investigator_name || '',
        finding_observation: finding,
        rekomendasi: recommendation,
        soc_number: observation.soc_number || socNo,
        ...patchExtra,
      }
      if (canClassify && kategori && risiko) {
        patch.kategori = kategori
        patch.tingkat_risiko = risiko
        patch.is_hipo = computeIsHiPo({
          kategori,
          tingkat_risiko: risiko,
          potensi_risiko: risiko,
          stop_work: observation.stop_work,
        })
      }
      await onSave(observation.id, patch)
      setSaved(true)
      setTimeout(() => setSaved(false), 1500)
      return true
    } catch (err) {
      setError(err.message || 'Could not save.')
      return false
    } finally {
      setSaving(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    await persist()
  }

  async function handleSendFollowUp() {
    setLinkNote('')
    const mode = capaMode(kategori)
    if (mode === 'none') {
      setError(capaModeNote(kategori))
      return
    }
    if (!kategori || !risiko) {
      setError('Konfirmasi jenis pengamatan dan risiko sebelum mengirim CAPA.')
      return
    }
    const head = assignableDepartmentHeads().find((person) => person.id === assigneeId)
    if (!head) {
      setError('Pilih satu kepala departemen dari daftar resmi. Bukan kotak email bebas, dan bukan HSSE.')
      return
    }
    const token = observation.followup_token || randomToken()
    const nextStatus = status === 'Closed' || status === 'Rejected' ? status : 'In Progress'
    const assignedLabel = `${head.name} · ${head.department}`
    const savedOk = await persist({
      pic_assigned: assignedLabel,
      followup_token: token,
      followup_email: head.email.trim().toLowerCase(),
      status: nextStatus,
    })
    if (!savedOk) return
    setPic(assignedLabel)
    setSaving(true)
    try {
      await queueFollowUpEmail(observation.id)
      setLinkNote(`Permintaan CAPA terkirim ke ${head.name}. HSSE menerima salinan. Mereka menutup kartu dari tautan yang sama.`)
    } catch (err) {
      setError(err.message || 'Permintaan CAPA gagal dikirim.')
    } finally {
      setSaving(false)
    }
  }

  const pdfObservation = useMemo(
    () => ({
      ...observation,
      soc_number: observation.soc_number || socNo,
      pdf_to: pdfTo || observation.pdf_to,
      pdf_pic: pdfPic || observation.pdf_pic,
      pdf_subject: pdfSubject || observation.pdf_subject,
      pdf_action_checks: actionChecks,
      investigation_data: inv,
      finding_observation: finding,
      rekomendasi: recommendation,
      root_cause: inv.root_cause || observation.root_cause,
      pic_assigned: pic || observation.pic_assigned,
      requires_investigation: requiresInvestigation,
      catatan_penutupan: catatan,
      triage_notes: triageNotes,
      kategori: kategori || observation.kategori,
      tingkat_risiko: risiko || observation.tingkat_risiko,
    }),
    [
      observation,
      socNo,
      pdfTo,
      pdfPic,
      pdfSubject,
      actionChecks,
      inv,
      finding,
      recommendation,
      pic,
      requiresInvestigation,
      catatan,
      triageNotes,
      kategori,
      risiko,
    ],
  )

  const heads = assignableDepartmentHeads()
  const mode = capaMode(kategori)
  const reporterSuggestion = observation.tindakan_langsung || ''

  return (
    <>
      <div className="admin-panel flex max-h-none flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 md:max-h-[calc(100vh-12rem)]">
      <div className="shrink-0 space-y-3 border-b border-slate-800 p-4 pb-3 md:p-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-semibold text-slate-100">{reporterName}</h2>
              {reporterId && (
                <span className="rounded-full bg-slate-800 px-2 py-0.5 font-mono text-[10px] text-slate-300">
                  {reporterId}
                </span>
              )}
              {!revealReporter && (
                <span className="text-[10px] text-slate-500">Nama pelapor hanya Super Admin</span>
              )}
              {observation.is_hipo && <HiPoBadge />}
              {observation.stop_work && (
                <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-medium text-white">Stop Work</span>
              )}
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
              <BuildingIcon className="h-3.5 w-3.5" />
              {observation.departemen}
              {observation.nama_perusahaan ? ` · ${observation.nama_perusahaan}` : ''}
            </div>
            <p className="mt-1 font-mono text-[10px] text-slate-500">{socNo}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex flex-wrap justify-end gap-1">
              <button
                type="button"
                onClick={() => setPdfReview('soc')}
                className="rounded-lg border border-slate-700 px-2 py-1 text-[10px] font-medium text-slate-400 hover:border-brand-500 hover:text-brand-400"
              >
                PDF SOC
              </button>
            </div>
            <RiskBadge level={observation.tingkat_risiko} pending={pendingClass} />
            <StatusBadge status={observation.status} />
          </div>
        </div>

        <div className="flex gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                tab === t ? 'bg-brand-600 text-white' : 'text-slate-500 hover:bg-slate-800'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {tab === 'Detail' && (
          <div className="space-y-4">
            <dl className="space-y-2.5 text-sm">
              <DetailRow icon={<PinIcon className="h-3.5 w-3.5" />} label="Location" value={observation.lokasi_teks} />
              {reporterId && <DetailRow label="Employee ID" value={reporterId} />}
              {observation.life_saving_rule && observation.life_saving_rule !== 'Tidak terkait' && (
                <DetailRow label="Life Saving Rule" value={observation.life_saving_rule} />
              )}
              <DetailRow label="Jenis dari pelapor" value={categoryLabel(observation.kategori)} />
              <DetailRow label="Description" value={observation.deskripsi} />
              {reporterSuggestion && <DetailRow label="Saran pelapor" value={reporterSuggestion} />}
            </dl>

            {observation.foto?.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {observation.foto.map((src, i) => (
                  <a key={i} href={src} target="_blank" rel="noreferrer">
                    <img src={src} alt={`Bukti ${i + 1}`} className="aspect-square rounded-lg object-cover" />
                  </a>
                ))}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3 border-t border-slate-800 pt-4">
              {!canEdit && (
                <p className="text-xs text-amber-400">Viewer mode — reports cannot be edited.</p>
              )}
              <fieldset disabled={!canEdit} className="space-y-3 disabled:opacity-60">
                {pendingClass && (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
                    {isUnclassifiedCategory(observation.kategori)
                      ? 'Jenis pengamatan dan risiko masih kosong. Konfirmasi di bawah.'
                      : `Pelapor memilih ${categoryLabel(observation.kategori)}. Konfirmasi jenisnya, lalu isi risiko.`}
                  </div>
                )}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-slate-400">Jenis pengamatan (konfirmasi HSE)</span>
                    <select
                      value={kategori}
                      onChange={(e) => setKategori(e.target.value)}
                      disabled={!canClassify}
                      className="admin-input"
                    >
                      <option value="">— Unclassified —</option>
                      {KATEGORI_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {categoryLabel(opt)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-slate-400">Risk (HSE)</span>
                    <select
                      value={risiko}
                      onChange={(e) => setRisiko(e.target.value)}
                      disabled={!canClassify}
                      className="admin-input"
                    >
                      <option value="">— Unclassified —</option>
                      {RISIKO_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="rounded-xl border border-slate-700 bg-slate-800/40 px-3 py-2.5 text-xs text-slate-300">
                  <p className="font-medium text-slate-100">CAPA</p>
                  <p className="mt-1 text-slate-400">{capaModeNote(kategori)}</p>
                </div>

                {mode !== 'none' && (
                  heads.length === 0 ? (
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-200">
                      Daftar kepala departemen belum resmi. Minta nama, jabatan, dan email ke Rano sebelum dropdown diisi. Jangan menebak dari catatan rapat. HSSE tidak dijadikan penanggung jawab perbaikan.
                    </div>
                  ) : (
                    <label className="block">
                      <span className="mb-1 block text-xs font-medium text-slate-400">
                        Kepala departemen {mode === 'required' ? '(wajib)' : '(boleh dikirim)'}
                      </span>
                      <select
                        value={assigneeId}
                        onChange={(e) => setAssigneeId(e.target.value)}
                        className="admin-input"
                      >
                        <option value="">— Pilih satu nama —</option>
                        {heads.map((person) => (
                          <option key={person.id} value={person.id}>
                            {person.name} · {person.department}
                            {person.title ? ` · ${person.title}` : ''}
                          </option>
                        ))}
                      </select>
                      <span className="mt-1 block text-[10px] text-slate-500">
                        Satu nama, bukan email bebas. Pengirimnya sistem. HSSE dapat salinan, bukan yang menutup pekerjaan.
                      </span>
                    </label>
                  )
                )}

                {observation.followup_token && (
                  <div className="rounded-xl border border-slate-700 bg-slate-800/40 px-3 py-2.5 text-xs text-slate-300">
                    <p className="font-medium text-slate-100">
                      Department status: {observation.followup_status || 'Waiting for the department'}
                    </p>
                    {observation.followup_deadline && <p className="mt-1">Deadline: {observation.followup_deadline}</p>}
                    {observation.followup_action_plan && <p className="mt-1">{observation.followup_action_plan}</p>}
                    {observation.followup_overdue_reason && (
                      <p className="mt-1 text-amber-300">Past deadline: {observation.followup_overdue_reason}</p>
                    )}
                    <p className="mt-2 break-all font-mono text-[10px] text-slate-500">
                      {`${window.location.origin}/follow-up/${observation.followup_token}`}
                    </p>
                  </div>
                )}

                {mode !== 'none' && heads.length > 0 && (
                  <button
                    type="button"
                    disabled={saving || !canEdit}
                    onClick={handleSendFollowUp}
                    className="w-full rounded-xl border border-brand-500/40 px-4 py-2.5 text-sm font-medium text-brand-300 hover:bg-brand-500/10 disabled:opacity-50"
                  >
                    {observation.followup_token ? 'Kirim ulang permintaan CAPA' : 'Kirim permintaan CAPA'}
                  </button>
                )}
                {linkNote && <p className="text-xs text-emerald-300">{linkNote}</p>}

                <div className="rounded-xl border border-dashed border-slate-700 px-3 py-2 text-[11px] text-slate-500">
                  Surat PDF opsional. Tidak menahan kartu, dan tidak wajib diisi sebelum CAPA jalan.
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-slate-400">Kepada / To (PDF)</span>
                    <input
                      type="text"
                      value={pdfTo}
                      onChange={(e) => setPdfTo(e.target.value)}
                      className="admin-input"
                      placeholder="Input manual HSE…"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-slate-400">PIC / Assigned (PDF)</span>
                    <input
                      type="text"
                      value={pdfPic}
                      onChange={(e) => setPdfPic(e.target.value)}
                      className="admin-input"
                      placeholder="Input manual HSE…"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-slate-400">
                    Perihal / Subject (PDF)
                  </span>
                  <input
                    type="text"
                    value={pdfSubject}
                    onChange={(e) => setPdfSubject(e.target.value)}
                    className="admin-input"
                    placeholder={buildPdfSubject({
                      ...observation,
                      kategori,
                      tingkat_risiko: risiko,
                    })}
                  />
                  <span className="mt-1 block text-[10px] text-slate-500">
                    Nama pelapor tidak masuk PDF. Hanya Super Admin yang melihat nama aslinya di dashboard.
                  </span>
                </label>

                <div className="rounded-xl border border-slate-700 bg-slate-800/40 px-3 py-2.5">
                  <p className="mb-2 text-xs font-medium text-slate-300">
                    Actions already taken (check for PDF)
                  </p>
                  <ul className="space-y-1.5">
                    {noticeActions.id.map((text, i) => (
                      <li key={`${i}-${text.slice(0, 24)}`}>
                        <label className="flex items-start gap-2 text-xs text-slate-300">
                          <input
                            type="checkbox"
                            checked={actionChecks[i] !== false}
                            onChange={() =>
                              setActionChecks((prev) => {
                                const next = normalizeActionChecks(noticeActions.id.length, prev)
                                next[i] = !next[i]
                                return next
                              })
                            }
                            className="mt-0.5"
                          />
                          <span>{text}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>

                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-slate-400">Status workflow</span>
                  {observation.followup_token && observation.status === 'Closed' ? (
                    <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
                      Closed by the follow-up department. HSSE does not close this manually.
                    </p>
                  ) : (
                    <select value={status} onChange={(e) => setStatus(e.target.value)} className="admin-input">
                      {(observation.followup_token ? STATUS_OPTIONS.filter((opt) => opt !== 'Closed') : STATUS_OPTIONS).map(
                        (opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ),
                      )}
                    </select>
                  )}
                  {observation.followup_token && observation.status !== 'Closed' && (
                    <span className="mt-1 block text-[10px] text-slate-500">
                      Closure is done by the department on the follow-up link.
                    </span>
                  )}
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-slate-400">HSE triage notes</span>
                  <textarea
                    rows={2}
                    value={triageNotes}
                    onChange={(e) => setTriageNotes(e.target.value)}
                    className="admin-input"
                    placeholder="Initial severity and priority review…"
                  />
                </label>

                {(status === 'Closed' || status === 'Pending Verification') && (
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-slate-400">Closing notes</span>
                    <textarea
                      rows={2}
                      value={catatan}
                      onChange={(e) => setCatatan(e.target.value)}
                      className="admin-input"
                      placeholder="Actions already completed…"
                    />
                  </label>
                )}

                {status === 'Pending Verification' && (
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-slate-400">Effectiveness verification</span>
                    <textarea
                      rows={2}
                      value={verificationNotes}
                      onChange={(e) => setVerificationNotes(e.target.value)}
                      className="admin-input"
                      placeholder="Evidence the action worked…"
                    />
                  </label>
                )}

                {error && <p className="text-sm text-red-400">{error}</p>}
                <button type="submit" disabled={saving || !canEdit} className="btn-primary w-full">
                  {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save changes'}
                </button>
              </fieldset>
            </form>
          </div>
        )}

        {tab === 'Recommendation' && (
          <RecommendationPanel
            observationId={observation.id}
            finding={finding}
            recommendation={recommendation}
            onFindingChange={setFinding}
            onRecommendationChange={setRecommendation}
            onSaveText={() => persist()}
            saving={saving}
            saved={saved}
            canEdit={canEdit}
            error={error}
          />
        )}
      </div>
      </div>
      {pdfReview && (
        <Suspense fallback={null}>
          <PdfReviewModal
            key={`${observation.id}-${pdfReview}`}
            kind={pdfReview}
            observation={pdfObservation}
            onClose={() => setPdfReview(null)}
            canDownload
          />
        </Suspense>
      )}
    </>
  )
}

function DetailRow({ icon, label, value }) {
  return (
    <div>
      <dt className="flex items-center gap-1 text-xs font-medium text-slate-400">
        {icon}
        {label}
      </dt>
      <dd className="text-slate-300">{value}</dd>
    </div>
  )
}
