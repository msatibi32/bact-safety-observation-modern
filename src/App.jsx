import { Route, Routes } from 'react-router-dom'
import RequireRole from './components/RequireRole'
import AdminActivity from './pages/AdminActivity'
import AdminDashboard from './pages/AdminDashboard'
import AdminLogin from './pages/AdminLogin'
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
      <Route path="/admin/aktivitas" element={<RequireRole minRole="admin"><AdminActivity /></RequireRole>} />
      <Route path="/admin/pengaturan" element={<RequireRole minRole="hse"><AdminSettings /></RequireRole>} />
    </Routes>
  )
}
