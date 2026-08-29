import { jsPDF } from 'jspdf'
import { BRANDING } from './branding'

export function exportObservationPdf(obs) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const margin = 16
  let y = margin

  const line = (text, size = 10, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setFontSize(size)
    const lines = doc.splitTextToSize(String(text ?? '—'), 180)
    if (y + lines.length * 5 > 280) {
      doc.addPage()
      y = margin
    }
    doc.text(lines, margin, y)
    y += lines.length * 5 + 2
  }

  doc.setFillColor(26, 26, 26)
  doc.rect(0, 0, 210, 28, 'F')
  doc.setTextColor(243, 112, 33)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text(BRANDING.legalName, margin, 12)
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(10)
  doc.text(BRANDING.appName, margin, 20)

  y = 36
  doc.setTextColor(30, 30, 30)
  line('LAPORAN OBSERVASI KESELAMATAN', 12, true)
  line(`ID: ${obs.id}`, 8)
  line(`Dibuat: ${new Date(obs.created_at).toLocaleString('id-ID')}`, 8)
  y += 4

  const fields = [
    ['Pelapor', obs.is_anonymous ? 'Anonim' : obs.nama_pelapor],
    ['Departemen', obs.departemen],
    ['Perusahaan', obs.nama_perusahaan],
    ['Tanggal kejadian', new Date(obs.tanggal_waktu).toLocaleString('id-ID')],
    ['Lokasi', obs.lokasi_teks],
    ['GPS', obs.lokasi_gps ? `${obs.lokasi_gps.lat}, ${obs.lokasi_gps.lng}` : '—'],
    ['Kategori', obs.kategori],
    ['Risiko aktual', obs.tingkat_risiko],
    ['Potensi risiko', obs.potensi_risiko],
    ['HiPo', obs.is_hipo ? 'Ya' : 'Tidak'],
    ['Life Saving Rule', obs.life_saving_rule],
    ['Stop Work', obs.stop_work ? 'Ya' : 'Tidak'],
    ['Status', obs.status],
    ['PIC', obs.pic_assigned || '—'],
    ['Deskripsi', obs.deskripsi],
    ['Tindakan langsung', obs.tindakan_langsung],
    ['Rekomendasi', obs.rekomendasi],
    ['Triage HSE', obs.triage_notes],
    ['Investigasi', obs.investigation_notes],
    ['Root cause', obs.root_cause],
    ['Catatan penutupan', obs.catatan_penutupan],
  ]

  for (const [label, value] of fields) {
    if (!value) continue
    line(`${label}:`, 9, true)
    line(value, 9)
  }

  doc.save(`SOC-${obs.id.slice(0, 8)}.pdf`)
}
