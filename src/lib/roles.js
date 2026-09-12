export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  HSE: 'hse',
  PIC: 'pic',
  VIEWER: 'viewer',
}

export const ROLE_LABELS = {
  super_admin: 'Super Admin',
  admin: 'Super Admin',
  hse: 'HSE Officer',
  pic: 'PIC / Department',
  viewer: 'Viewer (view only)',
}

/** Hierarchy: higher index = more access. admin & super_admin = pantau semua. */
const RANK = { viewer: 0, pic: 1, hse: 2, admin: 3, super_admin: 4 }

export function getUserRole(user) {
  return user?.user_metadata?.role || ROLES.HSE
}

export function getUserPicDepartment(user) {
  return user?.user_metadata?.pic_department || ''
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

export function canEditObservations(user) {
  return hasMinRole(user, ROLES.PIC)
}

export function canClassifyObservations(user) {
  return hasMinRole(user, ROLES.HSE)
}

export function canManageKpi(user) {
  return isSuperAdmin(user)
}

export function canManageNotifications(user) {
  return hasMinRole(user, ROLES.HSE)
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
