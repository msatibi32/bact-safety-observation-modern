import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import CookieConsent from './components/CookieConsent'
import RequireRole from './components/RequireRole'
import HomePage from './pages/HomePage'
import ReportForm from './pages/ReportForm'

const AdminActivity = lazy(() => import('./pages/AdminActivity'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const AdminIncidents = lazy(() => import('./pages/AdminIncidents'))
const AdminLogin = lazy(() => import('./pages/AdminLogin'))
const AdminManHours = lazy(() => import('./pages/AdminManHours'))
const AdminModulePage = lazy(() => import('./pages/AdminModulePage'))
const AdminPerforma = lazy(() => import('./pages/AdminPerforma'))
const AdminPermits = lazy(() => import('./pages/AdminPermits'))
const AdminSettings = lazy(() => import('./pages/AdminSettings'))
const AdminStatistik = lazy(() => import('./pages/AdminStatistik'))
const AdminSummary = lazy(() => import('./pages/AdminSummary'))
const AdminUsers = lazy(() => import('./pages/AdminUsers'))
const AdminVisits = lazy(() => import('./pages/AdminVisits'))
const CookiePolicy = lazy(() => import('./pages/CookiePolicy'))
const FollowUpForm = lazy(() => import('./pages/FollowUpForm'))
const PassPage = lazy(() => import('./pages/PassPage'))
const PermitForm = lazy(() => import('./pages/PermitForm'))
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'))
const QrPoster = lazy(() => import('./pages/QrPoster'))
const VisitForm = lazy(() => import('./pages/VisitForm'))

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
        <Route path="/" element={<HomePage />} />
        <Route path="/lapor" element={<ReportForm />} />
        <Route
          path="/ptw"
          element={
            <Suspense fallback={<PageFallback />}>
              <PermitForm />
            </Suspense>
          }
        />
        <Route
          path="/visit"
          element={
            <Suspense fallback={<PageFallback />}>
              <VisitForm />
            </Suspense>
          }
        />
        <Route
          path="/pass/:kind/:token"
          element={
            <Suspense fallback={<PageFallback />}>
              <PassPage />
            </Suspense>
          }
        />
        <Route
          path="/follow-up/:token"
          element={
            <Suspense fallback={<PageFallback />}>
              <FollowUpForm />
            </Suspense>
          }
        />
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
          path="/admin/performa"
          element={
            <RequireRole minRole="viewer">
              <Suspense fallback={<AdminFallback />}>
                <AdminPerforma />
              </Suspense>
            </RequireRole>
          }
        />
        <Route
          path="/admin/statistik"
          element={
            <RequireRole minRole="viewer">
              <Suspense fallback={<AdminFallback />}>
                <AdminStatistik />
              </Suspense>
            </RequireRole>
          }
        />
        <Route
          path="/admin/insiden"
          element={
            <RequireRole minRole="viewer">
              <Suspense fallback={<AdminFallback />}>
                <AdminIncidents />
              </Suspense>
            </RequireRole>
          }
        />
        <Route
          path="/admin/man-hours"
          element={
            <RequireRole minRole="viewer">
              <Suspense fallback={<AdminFallback />}>
                <AdminManHours />
              </Suspense>
            </RequireRole>
          }
        />
        <Route
          path="/admin/modul/:moduleKey"
          element={
            <RequireRole minRole="viewer">
              <Suspense fallback={<AdminFallback />}>
                <AdminModulePage />
              </Suspense>
            </RequireRole>
          }
        />
        <Route
          path="/admin/ptw"
          element={
            <RequireRole minRole="viewer">
              <Suspense fallback={<AdminFallback />}>
                <AdminPermits />
              </Suspense>
            </RequireRole>
          }
        />
        <Route
          path="/admin/visit"
          element={
            <RequireRole minRole="viewer">
              <Suspense fallback={<AdminFallback />}>
                <AdminVisits />
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
