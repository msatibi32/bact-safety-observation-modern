import { useEffect, useMemo, useState } from 'react'
import { HiPoBadge, RiskBadge, StatusBadge } from './Badge'
import InvestigationForm from './InvestigationForm'
import RecommendationPanel from './RecommendationPanel'
import { BuildingIcon, PinIcon } from './Icon'
import {
  DEPARTMENT_OPTIONS,
  KATEGORI_OPTIONS,
  RISIKO_OPTIONS,
  STATUS_OPTIONS,
  computeIsHiPo,
  isUnclassifiedObservation,
} from '../lib/constants'
import {
  buildSummary5W1H,
  hasInvestigationContent,
  investigationPlainSummary,
  parseInvestigationData,
} from '../lib/investigation'
import { exportInvestigationPdf, exportObservationPdf } from '../lib/pdf'
import { buildNoticeActions } from '../lib/pdfNarrative'
import { buildPdfSubject, normalizeActionChecks } from '../lib/pdfMeta'
import { canClassifyObservations, canEditObservations } from '../lib/roles'
import { resolveSocNumber } from '../lib/socNumber'
import { useUser } from './RequireRole'

const TABS = ['Detail', 'Investigation', 'Recommendation']

export default function ObservationDetailPanel({ observation, onSave, allObservations = [] }) {
  const user = useUser()
  const canEdit = canEditObservations(user)
  const canClassify = canClassifyObservations(user)
  const pendingClass = isUnclassifiedObservation(observation)
  const [tab, setTab] = useState('Detail')
  const [pic, setPic] = useState(observation.pic_assigned || '')
  const [status, setStatus] = useState(observation.status)
  const [kategori, setKategori] = useState(pendingClass ? '' : observation.kategori)
  const [risiko, setRisiko] = useState(pendingClass ? '' : observation.tingkat_risiko)
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
  const [pdfBusy, setPdfBusy] = useState('')

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
    const pending = isUnclassifiedObservation(observation)
    setPic(observation.pic_assigned || '')
    setStatus(observation.status)
    setKategori(pending ? '' : observation.kategori)
    setRisiko(pending ? '' : observation.tingkat_risiko)
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
      return
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
    } catch (err) {
      setError(err.message || 'Could not save.')
    } finally {
      setSaving(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    await persist()
  }

  async function handlePdf(type) {
    setPdfBusy(type)
    try {
      const enriched = {
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
      }
      if (type === 'soc') await exportObservationPdf(enriched)
      else await exportInvestigationPdf(enriched)
    } catch {
      setError('PDF export failed.')
    } finally {
      setPdfBusy('')
    }
  }

  const suggestedInvestigate = observation.is_hipo || risiko === 'High'
  const invActive = requiresInvestigation || hasInvestigationContent(inv)

  return (
    <div className="admin-panel flex max-h-none flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 md:max-h-[calc(100vh-12rem)]">
      <div className="shrink-0 space-y-3 border-b border-slate-800 p-4 pb-3 md:p-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-semibold text-slate-100">{observation.nama_pelapor}</h2>
              {observation.employee_id && (
                <span className="rounded-full bg-slate-800 px-2 py-0.5 font-mono text-[10px] text-slate-300">
                  {observation.employee_id}
                </span>
              )}
              {observation.is_hipo && <HiPoBadge />}
              {observation.stop_work && (
                <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-medium text-white">Stop Work</span>
              )}
              {requiresInvestigation && (
                <span className="rounded-full bg-amber-600/80 px-2 py-0.5 text-[10px] font-medium text-white">
                  Investigation
                </span>
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
                onClick={() => handlePdf('soc')}
                disabled={Boolean(pdfBusy)}
                className="rounded-lg border border-slate-700 px-2 py-1 text-[10px] font-medium text-slate-400 hover:border-brand-500 hover:text-brand-400"
              >
                {pdfBusy === 'soc' ? '…' : 'PDF SOC'}
              </button>
              {invActive && (
                <button
                  type="button"
                  onClick={() => handlePdf('inv')}
                  disabled={Boolean(pdfBusy)}
                  className="rounded-lg border border-amber-700/50 px-2 py-1 text-[10px] font-medium text-amber-400 hover:border-amber-500"
                >
                  {pdfBusy === 'inv' ? '…' : 'PDF Investigation'}
                </button>
              )}
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
              {t === 'Investigation' && requiresInvestigation && <span className="ml-1 text-amber-300">●</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {tab === 'Detail' && (
          <div className="space-y-4">
            <dl className="space-y-2.5 text-sm">
              <DetailRow icon={<PinIcon className="h-3.5 w-3.5" />} label="Location" value={observation.lokasi_teks} />
              {observation.employee_id && <DetailRow label="Employee ID" value={observation.employee_id} />}
              {observation.life_saving_rule && observation.life_saving_rule !== 'Tidak terkait' && (
                <DetailRow label="Life Saving Rule" value={observation.life_saving_rule} />
              )}
              <DetailRow label="Description" value={observation.deskripsi} />
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
                    Category and risk are empty. Set the HSE classification below.
                  </div>
                )}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-slate-400">Category (HSE)</span>
                    <select
                      value={kategori}
                      onChange={(e) => setKategori(e.target.value)}
                      disabled={!canClassify}
                      className="admin-input"
                    >
                      <option value="">— Unclassified —</option>
                      {KATEGORI_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
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

                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-slate-400">Follow-up department</span>
                  <select value={pic} onChange={(e) => setPic(e.target.value)} className="admin-input">
                    <option value="">— Not assigned —</option>
                    {DEPARTMENT_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex items-start gap-2 rounded-xl border border-slate-700 bg-slate-800/40 px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={requiresInvestigation}
                    onChange={(e) => setRequiresInvestigation(e.target.checked)}
                    className="mt-0.5"
                  />
                  <span className="text-xs text-slate-300">
                    <span className="font-medium text-slate-100">Continue to investigation</span>
                    <span className="mt-0.5 block text-slate-500">
                      Not every SOC needs an investigation. Check only if a full investigation report is required.
                      {suggestedInvestigate && !requiresInvestigation
                        ? ' (HiPo/High — investigation recommended.)'
                        : ''}
                    </span>
                  </span>
                </label>

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
                    Reporter name is not in the subject — the PDF has a Reporter / Reported by column.
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
                  <select value={status} onChange={(e) => setStatus(e.target.value)} className="admin-input">
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
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

        {tab === 'Investigation' && (
          <form
            onSubmit={handleSubmit}
            className="space-y-3"
          >
            {!requiresInvestigation && (
              <div className="rounded-xl border border-slate-700 bg-slate-800/40 px-3 py-2 text-xs text-slate-400">
                This SOC is not marked for investigation. Check the box on the Detail tab if a full investigation
                report is needed (daily cases usually only need the SOC PDF).
              </div>
            )}
            {requiresInvestigation && suggestedInvestigate && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
                HiPo / High — complete 5W+1H and 5 Whys so the investigation draft stays consistent.
              </div>
            )}
            <InvestigationForm data={inv} onChange={setInv} disabled={!canEdit} />
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button type="submit" disabled={saving || !canEdit} className="btn-primary w-full">
              {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save investigation'}
            </button>
          </form>
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
