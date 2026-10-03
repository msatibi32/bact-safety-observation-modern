import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import CookieConsent from './components/CookieConsent'
import RequireRole from './components/RequireRole'
import ReportForm from './pages/ReportForm'

const AdminActivity = lazy(() => import('./pages/AdminActivity'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const AdminLogin = lazy(() => import('./pages/AdminLogin'))
const AdminSettings = lazy(() => import('./pages/AdminSettings'))
const AdminSummary = lazy(() => import('./pages/AdminSummary'))
const AdminUsers = lazy(() => import('./pages/AdminUsers'))
const CookiePolicy = lazy(() => import('./pages/CookiePolicy'))
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'))
const QrPoster = lazy(() => import('./pages/QrPoster'))

function AdminFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-sm text-slate-400">
      Memuat…
    </div>
  )
}

function PageFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white text-sm text-slate-500">
      Memuat…
    </div>
  )
}

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<ReportForm />} />
        <Route
          path="/privacy"
          element={
            <Suspense fallback={<PageFallback />}>
              <PrivacyPolicy />
            </Suspense>
          }
        />
        <Route
          path="/cookies"
          element={
            <Suspense fallback={<PageFallback />}>
              <CookiePolicy />
            </Suspense>
          }
        />
        <Route
          path="/qr"
          element={
            <Suspense fallback={<PageFallback />}>
              <QrPoster />
            </Suspense>
          }
        />
        <Route
          path="/admin/login"
          element={
            <Suspense fallback={<AdminFallback />}>
              <AdminLogin />
            </Suspense>
          }
        />
        <Route
          path="/admin"
          element={
            <RequireRole minRole="viewer">
              <Suspense fallback={<AdminFallback />}>
                <AdminDashboard />
              </Suspense>
            </RequireRole>
          }
        />
        <Route
          path="/admin/ringkasan"
          element={
            <RequireRole minRole="viewer">
              <Suspense fallback={<AdminFallback />}>
                <AdminSummary />
              </Suspense>
            </RequireRole>
          }
        />
        <Route
          path="/admin/aktivitas"
          element={
            <RequireRole minRole="admin">
              <Suspense fallback={<AdminFallback />}>
                <AdminActivity />
              </Suspense>
            </RequireRole>
          }
        />
        <Route
          path="/admin/pengaturan"
          element={
            <RequireRole minRole="admin">
              <Suspense fallback={<AdminFallback />}>
                <AdminSettings />
              </Suspense>
            </RequireRole>
          }
        />
        <Route
          path="/admin/pengguna"
          element={
            <RequireRole minRole="admin">
              <Suspense fallback={<AdminFallback />}>
                <AdminUsers />
              </Suspense>
            </RequireRole>
          }
        />
      </Routes>
      <CookieConsent />
    </>
  )
}
