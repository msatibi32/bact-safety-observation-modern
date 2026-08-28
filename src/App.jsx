import { Route, Routes } from 'react-router-dom'
import RequireAdmin from './components/RequireAdmin'
import AdminDashboard from './pages/AdminDashboard'
import AdminLogin from './pages/AdminLogin'
import AdminSummary from './pages/AdminSummary'
import ReportForm from './pages/ReportForm'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ReportForm />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <AdminDashboard />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/ringkasan"
        element={
          <RequireAdmin>
            <AdminSummary />
          </RequireAdmin>
        }
      />
    </Routes>
  )
}
