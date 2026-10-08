export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  HSE: 'hse',
  SPV: 'spv',
  PIC: 'pic',
  VIEWER: 'viewer',
}

export const ROLE_LABELS = {
  super_admin: 'Super Admin',
  admin: 'Super Admin',
  hse: 'HSE Officer',
  spv: 'SPV / Area Authority',
  pic: 'PIC / Department',
  viewer: 'Viewer (view only)',
}

/** Hierarchy: higher index = more access. admin & super_admin = pantau semua. */
const RANK = { viewer: 0, pic: 1, spv: 1, hse: 2, admin: 3, super_admin: 4 }

export function getUserRole(user) {
  const role = user?.app_metadata?.role || user?.user_metadata?.role
  if (role && RANK[role] != null) return role
  return ROLES.VIEWER
}

export function getUserPicDepartment(user) {
  return user?.app_metadata?.pic_department || user?.user_metadata?.pic_department || ''
}

export function hasMinRole(user, minRole) {
  const current = getUserRole(user)
  return (RANK[current] ?? 0) >= (RANK[minRole] ?? 0)
}

/** Super Admin: role admin atau super_admin — performa HSE + activity log. */
export function isSuperAdmin(user) {
  const role = getUserRole(user)
  return role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN
}

/** Nama pelapor di kartu yang keluar hanya terlihat Super Admin. */
export const HIDDEN_REPORTER_LABEL = 'Disembunyikan'

export function visibleReporterName(obs, user) {
  if (isSuperAdmin(user)) return obs?.nama_pelapor || '—'
  return HIDDEN_REPORTER_LABEL
}

export function visibleEmployeeId(obs, user) {
  if (!isSuperAdmin(user)) return ''
  return obs?.employee_id || ''
}

export function canEditObservations(user) {
  return hasMinRole(user, ROLES.HSE)
}

/** Langkah 1 permit: hanya akun SPV, atau Super Admin jika SPV belum punya akun. */
export function canApproveSpvStep(user) {
  const role = getUserRole(user)
  return role === ROLES.SPV || role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN
}

/** Langkah 2 permit: HSSE. Akun SPV tidak bisa melewati langkah ini. */
export function canApproveHsseStep(user) {
  const role = getUserRole(user)
  return role === ROLES.HSE || role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN
}

export function canUploadStaffSignature(user) {
  return canApproveSpvStep(user) || canApproveHsseStep(user)
}

/** Akun SPV hanya membuka dashboard PTW. */
export function isSpvOnly(user) {
  return getUserRole(user) === ROLES.SPV
}

export function canClassifyObservations(user) {
  return hasMinRole(user, ROLES.HSE)
}

export function canManageKpi(user) {
  return isSuperAdmin(user)
}

/** Super Admin only — Notifications / email list. HSE Officer cannot open this menu. */
export function canManageNotifications(user) {
  return isSuperAdmin(user)
}

export function canViewHsePerformance(user) {
  return isSuperAdmin(user)
}

export function canViewActivityLog(user) {
  return isSuperAdmin(user)
}

export function canManageUsers(user) {
  return isSuperAdmin(user)
}

export const ASSIGNABLE_ROLES = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'hse', label: 'HSE Officer' },
  { value: 'spv', label: 'SPV / Area Authority' },
  { value: 'viewer', label: 'Viewer (view only)' },
]

export function displayRole(role) {
  if (role === 'admin' || role === 'super_admin') return 'Super Admin'
  return ROLE_LABELS[role] || role || '—'
}

export function filterObservationsForRole(observations, user) {
  const role = getUserRole(user)
  if (role === ROLES.PIC) {
    const dept = getUserPicDepartment(user)
    if (dept) {
      return observations.filter((o) => o.pic_assigned === dept || !o.pic_assigned)
    }
  }
  return observations
}
