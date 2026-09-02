import { useEffect, useMemo, useState } from 'react'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import AdminLayout from '../components/AdminLayout'
import { categoryLabel } from '../lib/constants'
import { getObservations } from '../lib/store'

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

const DEFAULT_CENTER = [-1.0456, 104.0305]

export default function AdminMap() {
  const [observations, setObservations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getObservations()
      .then(setObservations)
      .finally(() => setLoading(false))
  }, [])

  const pinned = useMemo(
    () => observations.filter((o) => o.lokasi_gps?.lat != null && o.lokasi_gps?.lng != null),
    [observations],
  )

  const center = pinned.length
    ? [pinned[0].lokasi_gps.lat, pinned[0].lokasi_gps.lng]
    : DEFAULT_CENTER

  return (
    <AdminLayout>
      <h1 className="mb-1 text-lg font-semibold text-slate-100">Peta Hotspot Lokasi</h1>
      <p className="mb-4 text-xs text-slate-500">{pinned.length} laporan dengan koordinat GPS</p>

      {loading && <p className="text-sm text-slate-500">Memuat peta…</p>}

      {!loading && pinned.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-slate-800">
          <MapContainer center={center} zoom={14} className="h-[60vh] min-h-[320px] w-full" scrollWheelZoom>
            <TileLayer
              attribution='&copy; OpenStreetMap'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {pinned.map((obs) => (
              <Marker key={obs.id} position={[obs.lokasi_gps.lat, obs.lokasi_gps.lng]}>
                <Popup>
                  <div className="text-sm">
                    <p className="font-semibold">{obs.is_anonymous ? 'Anonim' : obs.nama_pelapor}</p>
                    <p className="text-xs text-slate-600">{obs.lokasi_teks}</p>
                    <p className="mt-1 text-xs">{categoryLabel(obs.kategori)}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      )}

      {!loading && pinned.length === 0 && (
        <p className="mt-4 text-center text-sm text-slate-500">
          Belum ada laporan dengan GPS. Aktifkan lokasi saat submit form.
        </p>
      )}
    </AdminLayout>
  )
}
