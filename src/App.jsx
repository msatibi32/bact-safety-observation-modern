import { Route, Routes } from 'react-router-dom'
import RequireRole from './components/RequireRole'
import AdminDashboard from './pages/AdminDashboard'
import AdminLogin from './pages/AdminLogin'
import AdminMap from './pages/AdminMap'
import AdminSettings from './pages/AdminSettings'
import AdminSummary from './pages/AdminSummary'
import QrPoster from './pages/QrPoster'
import ReportForm from './pages/ReportForm'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ReportForm />} />
      <Route path="/qr" element={<QrPoster />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<RequireRole minRole="viewer"><AdminDashboard /></RequireRole>} />
      <Route path="/admin/ringkasan" element={<RequireRole minRole="viewer"><AdminSummary /></RequireRole>} />
      <Route path="/admin/peta" element={<RequireRole minRole="viewer"><AdminMap /></RequireRole>} />
      <Route path="/admin/pengaturan" element={<RequireRole minRole="admin"><AdminSettings /></RequireRole>} />
    </Routes>
  )
}
