export const ROLES = {
  ADMIN: 'admin',
  HSE: 'hse',
  PIC: 'pic',
  VIEWER: 'viewer',
}

export const ROLE_LABELS = {
  admin: 'Administrator',
  hse: 'HSE Officer',
  pic: 'PIC / Departemen',
  viewer: 'Viewer (read-only)',
}

/** Hierarchy: higher index = more access */
const RANK = { viewer: 0, pic: 1, hse: 2, admin: 3 }

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

export function canEditObservations(user) {
  return hasMinRole(user, ROLES.PIC)
}

export function canManageKpi(user) {
  return hasMinRole(user, ROLES.ADMIN)
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
