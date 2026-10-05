import { DEPARTMENT_OPTIONS, LOCATION_OPTIONS } from '../../lib/constants'
import { PERMIT_KINDS, WORK_TYPES } from '../../lib/passes'
import {
  CONTROLS,
  HAZARDS,
  PPE_ITEMS,
  PTW_SECTIONS,
  WORK_TYPE_TONES,
  emptyActivity,
  emptyReading,
} from '../../lib/ptwForm'

export default function PermitEditor({
  form,
  types,
  sheet,
  onForm,
  onSheet,
  onToggleType,
  onToggleOpen,
  onToggleList,
}) {
  const open = new Set(sheet.open)

  function patchRow(field, index, key, value) {
    const rows = sheet[field].map((row, i) => (i === index ? { ...row, [key]: value } : row))
    onSheet({ [field]: rows })
  }

  return (
    <div className="space-y-4 p-3 text-slate-200">
      <fieldset>
        <legend className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Jenis permit</legend>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {PERMIT_KINDS.map((kind) => (
            <button
              key={kind.id}
              type="button"
              onClick={() => onForm('permit_kind', kind.id)}
              className={`rounded-xl border px-2 py-2 text-left ${
                form.permit_kind === kind.id ? 'border-brand-500 bg-brand-500/10' : 'border-slate-700'
              }`}
            >
              <span className="block text-xs font-semibold">{kind.title}</span>
              <span className="block text-[10px] text-slate-400">{kind.life}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Bagian yang ikut tercetak</legend>
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          {PTW_SECTIONS.map((section) => {
            const on = open.has(section.id)
            return (
              <label key={section.id} className={`flex items-start gap-1.5 rounded-lg border px-2 py-1.5 text-[11px] ${on ? 'border-brand-500/60' : 'border-slate-800'}`}>
                <input type="checkbox" className="mt-0.5" checked={on} disabled={section.locked} onChange={() => onToggleOpen(section.id)} />
                <span>
                  {section.no}. {section.titleId}
                  {section.hint ? <span className="block text-[10px] text-slate-500">{section.hint}</span> : null}
                </span>
              </label>
            )
          })}
        </div>
      </fieldset>

      <Block title="1. Deskripsi pekerjaan">
        <Line label="Nama PIC">
          <input className="paper-input" value={form.applicant_name} onChange={(e) => onForm('applicant_name', e.target.value)} />
        </Line>
        <div className="grid grid-cols-2 gap-2">
          <Line label="Perusahaan">
            <input className="paper-input" value={form.company} onChange={(e) => onForm('company', e.target.value)} />
          </Line>
          <Line label="Telepon">
            <input className="paper-input" value={form.phone} onChange={(e) => onForm('phone', e.target.value)} />
          </Line>
        </div>
        <Line label="Email">
          <input className="paper-input" type="email" value={form.email} onChange={(e) => onForm('email', e.target.value)} />
        </Line>
        <p className="text-[10px] text-slate-500">Mengganti email tidak mengirim ulang barcode.</p>
        <div className="grid grid-cols-2 gap-2">
          <Line label="Departemen">
            <input className="paper-input" list="ptw-edit-dept" value={form.department} onChange={(e) => onForm('department', e.target.value)} />
            <datalist id="ptw-edit-dept">
              {DEPARTMENT_OPTIONS.map((item) => <option key={item} value={item} />)}
            </datalist>
          </Line>
          <Line label="Area kerja">
            <input className="paper-input" list="ptw-edit-area" value={form.area} onChange={(e) => onForm('area', e.target.value)} />
            <datalist id="ptw-edit-area">
              {LOCATION_OPTIONS.map((item) => <option key={item} value={item} />)}
            </datalist>
          </Line>
        </div>
        <Line label="Mulai">
          <input className="paper-input" type="datetime-local" value={form.start_at} onChange={(e) => onForm('start_at', e.target.value)} />
        </Line>
        <div className="grid grid-cols-2 gap-1.5">
          {WORK_TYPES.map((type) => {
            const on = types.includes(type)
            return (
              <label key={type} data-on={on} className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 text-xs font-medium data-[on=true]:ring-1 ${WORK_TYPE_TONES[type]}`}>
                <input type="checkbox" checked={on} onChange={() => onToggleType(type)} />
                {type}
              </label>
            )
          })}
        </div>
        <Line label="Detail pekerjaan">
          <textarea rows={3} className="paper-input" value={form.description} onChange={(e) => onForm('description', e.target.value)} />
        </Line>
      </Block>

      {open.has('2') && (
        <Block title="2. Tes sebelum bekerja">
          <p className="text-[10px] text-slate-500">Centang yang sesuai saja. Semua pilihan tetap tercetak di lembar.</p>
          <Checks title="Bahaya" items={HAZARDS} selected={sheet.hazards} onToggle={(id) => onToggleList('hazards', id)} />
          {sheet.hazards.includes('other') && (
            <Line label="Bahaya lainnya">
              <input className="paper-input" value={sheet.hazardOther} onChange={(e) => onSheet({ hazardOther: e.target.value })} />
            </Line>
          )}
          <Checks title="Kontrol" items={CONTROLS} selected={sheet.controls} onToggle={(id) => onToggleList('controls', id)} />
          {sheet.controls.includes('jsa') && (
            <Line label="Nomor JSA">
              <input className="paper-input" value={sheet.jsaNo} onChange={(e) => onSheet({ jsaNo: e.target.value })} />
            </Line>
          )}
          {sheet.controls.includes('other') && (
            <Line label="Kontrol lainnya">
              <input className="paper-input" value={sheet.controlOther} onChange={(e) => onSheet({ controlOther: e.target.value })} />
            </Line>
          )}
        </Block>
      )}

      {open.has('3') && (
        <Block title="3. Aktivitas dan APD">
          {sheet.activities.map((row, index) => (
            <div key={index} className="grid grid-cols-2 gap-1.5 rounded-lg border border-slate-800 p-2">
              <Mini label="Aktivitas" value={row.activity} onChange={(value) => patchRow('activities', index, 'activity', value)} />
              <Mini label="Alat" value={row.tool} onChange={(value) => patchRow('activities', index, 'tool', value)} />
              <Mini label="Bahaya" value={row.hazard} onChange={(value) => patchRow('activities', index, 'hazard', value)} />
              <Mini label="Tindakan" value={row.action} onChange={(value) => patchRow('activities', index, 'action', value)} />
            </div>
          ))}
          {sheet.activities.length < 8 && (
            <button type="button" className="text-xs font-medium text-brand-400" onClick={() => onSheet({ activities: [...sheet.activities, emptyActivity()] })}>
              Tambah aktivitas
            </button>
          )}
          <div className="grid grid-cols-2 gap-1.5">
            {PPE_ITEMS.map((item) => (
              <label key={item.id} className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={sheet.ppe.includes(item.id)} onChange={() => onToggleList('ppe', item.id)} />
                {item.label}
              </label>
            ))}
          </div>
        </Block>
      )}

      {open.has('4') && (
        <Block title="4. Isolasi">
          <Line label="Sertifikat isolasi mekanik">
            <input className="paper-input" value={sheet.mechanicalCert} onChange={(e) => onSheet({ mechanicalCert: e.target.value })} />
          </Line>
          <Line label="Sertifikat isolasi listrik">
            <input className="paper-input" value={sheet.electricalCert} onChange={(e) => onSheet({ electricalCert: e.target.value })} />
          </Line>
          <Line label="Lokasi lock out / tag out">
            <input className="paper-input" value={sheet.lotoLocation} onChange={(e) => onSheet({ lotoLocation: e.target.value })} />
          </Line>
        </Block>
      )}

      {open.has('5') && (
        <Block title="5. Tes gas">
          <div className="grid grid-cols-2 gap-2">
            <Line label="Nama gas tester">
              <input className="paper-input" value={sheet.gasTester} onChange={(e) => onSheet({ gasTester: e.target.value })} />
            </Line>
            <Line label="Jabatan">
              <input className="paper-input" value={sheet.gasPosition} onChange={(e) => onSheet({ gasPosition: e.target.value })} />
            </Line>
          </div>
          <Line label="Paraf / nama tanda tangan">
            <input className="paper-input" value={sheet.gasSignature} onChange={(e) => onSheet({ gasSignature: e.target.value })} />
          </Line>
          {sheet.readings.map((row, index) => (
            <div key={index} className="grid grid-cols-4 gap-1.5">
              <Mini label="Waktu" type="time" value={row.time} onChange={(value) => patchRow('readings', index, 'time', value)} />
              <Mini label="LEL %" value={row.lel} onChange={(value) => patchRow('readings', index, 'lel', value)} />
              <Mini label="O2 %" value={row.o2} onChange={(value) => patchRow('readings', index, 'o2', value)} />
              <Mini label="Toxic" value={row.toxic} onChange={(value) => patchRow('readings', index, 'toxic', value)} />
            </div>
          ))}
          {sheet.readings.length < 4 && (
            <button type="button" className="text-xs font-medium text-brand-400" onClick={() => onSheet({ readings: [...sheet.readings, emptyReading()] })}>
              Tambah hasil tes
            </button>
          )}
        </Block>
      )}

      <Block title="6. Persetujuan">
        <CheckLine checked={sheet.understand} onChange={(checked) => onSheet({ understand: checked })}>
          Mengerti kondisi izin dan akan mengarahkan krew.
        </CheckLine>
        <CheckLine checked={sheet.inspected} onChange={(checked) => onSheet({ inspected: checked })}>
          Sudah inspeksi area dan mengizinkan pekerjaan dimulai.
        </CheckLine>
        <CheckLine checked={sheet.commence} onChange={(checked) => onSheet({ commence: checked })}>
          Semua kondisi terpenuhi, pekerjaan boleh dimulai.
        </CheckLine>
        <Line label="Orang yang dinominasikan">
          <input className="paper-input" value={sheet.nominatedPerson} onChange={(e) => onSheet({ nominatedPerson: e.target.value })} />
        </Line>
        <div className="grid grid-cols-2 gap-2">
          <Mini label="Tanggal" value={sheet.nominatedDate} onChange={(value) => onSheet({ nominatedDate: value })} />
          <Mini label="Waktu" value={sheet.nominatedTime} onChange={(value) => onSheet({ nominatedTime: value })} />
        </div>
        <Line label="Otoritas area">
          <input className="paper-input" value={sheet.areaAuthority} onChange={(e) => onSheet({ areaAuthority: e.target.value })} />
        </Line>
        <div className="grid grid-cols-2 gap-2">
          <Mini label="Tanggal" value={sheet.areaDate} onChange={(value) => onSheet({ areaDate: value })} />
          <Mini label="Waktu" value={sheet.areaTime} onChange={(value) => onSheet({ areaTime: value })} />
        </div>
        <Line label="Permit Controller HSSE">
          <input className="paper-input" value={sheet.hsseName} onChange={(e) => onSheet({ hsseName: e.target.value })} />
        </Line>
        <div className="grid grid-cols-2 gap-2">
          <Mini label="Tanggal HSSE" value={sheet.hsseDate} onChange={(value) => onSheet({ hsseDate: value })} />
          <Mini label="Waktu HSSE" value={sheet.hsseTime} onChange={(value) => onSheet({ hsseTime: value })} />
        </div>
      </Block>

      {open.has('7') && (
        <Block title="7. Personil">
          <div className="grid grid-cols-2 gap-1.5">
            {sheet.people.map((name, index) => (
              <Mini
                key={index}
                label={`${index + 1}`}
                value={name}
                onChange={(value) => {
                  const people = sheet.people.map((item, i) => (i === index ? value : item))
                  onSheet({ people })
                }}
              />
            ))}
          </div>
          {sheet.people.length < 15 && (
            <button type="button" className="text-xs font-medium text-brand-400" onClick={() => onSheet({ people: [...sheet.people, ''] })}>
              Tambah personil
            </button>
          )}
        </Block>
      )}

      {open.has('8') && (
        <Block title="8. Buka isolasi">
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => onSheet({ deisolationStatus: 'complete' })} className={`rounded-lg border px-2 py-2 text-xs ${sheet.deisolationStatus === 'complete' ? 'border-emerald-500 text-emerald-300' : 'border-slate-700'}`}>
              Selesai
            </button>
            <button type="button" onClick={() => onSheet({ deisolationStatus: 'incomplete' })} className={`rounded-lg border px-2 py-2 text-xs ${sheet.deisolationStatus === 'incomplete' ? 'border-amber-500 text-amber-200' : 'border-slate-700'}`}>
              Belum selesai
            </button>
          </div>
          <CheckLine checked={sheet.deisolationAck} onChange={(checked) => onSheet({ deisolationAck: checked })}>
            Area bersih dan aman. Isolasi boleh atau tidak boleh dibuka sesuai status di atas.
          </CheckLine>
          <Line label="Area Authority - Engineering">
            <input className="paper-input" value={sheet.deisolationSigner} onChange={(e) => onSheet({ deisolationSigner: e.target.value })} />
          </Line>
          <div className="grid grid-cols-2 gap-2">
            <Mini label="Tanggal" value={sheet.deisolationDate} onChange={(value) => onSheet({ deisolationDate: value })} />
            <Mini label="Waktu" value={sheet.deisolationTime} onChange={(value) => onSheet({ deisolationTime: value })} />
          </div>
        </Block>
      )}
    </div>
  )
}

function Block({ title, children }) {
  return (
    <section className="space-y-2 border-t border-slate-800 pt-3">
      <h3 className="text-xs font-semibold text-slate-100">{title}</h3>
      {children}
    </section>
  )
}

function Line({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] uppercase tracking-wide text-slate-500">{label}</span>
      {children}
    </label>
  )
}

function Mini({ label, value, onChange, type = 'text' }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] text-slate-500">{label}</span>
      <input type={type} className="paper-input" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  )
}

function Checks({ title, items, selected, onToggle }) {
  return (
    <fieldset>
      <legend className="mb-1 text-[10px] uppercase tracking-wide text-slate-500">{title}</legend>
      <div className="space-y-1">
        {items.map((item) => (
          <label key={item.id} className="flex items-start gap-2 text-[11px]">
            <input type="checkbox" className="mt-0.5" checked={selected.includes(item.id)} onChange={() => onToggle(item.id)} />
            <span>{item.labelId}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

function CheckLine({ checked, onChange, children }) {
  return (
    <label className="flex items-start gap-2 text-[11px]">
      <input type="checkbox" className="mt-0.5" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{children}</span>
    </label>
  )
}
