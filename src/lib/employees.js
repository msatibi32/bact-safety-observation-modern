import { BACT_EMPLOYEES } from '../data/employees'
import { COMPANY_OPTIONS } from './constants'

export const BACT_COMPANY = COMPANY_OPTIONS[0]

export function isBactCompany(companyName) {
  return companyName === BACT_COMPANY
}

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function searchEmployees(query, limit = 8) {
  const q = normalize(query)
  if (q.length < 1) return []

  return BACT_EMPLOYEES.filter((emp) => {
    const name = normalize(emp.name)
    const id = normalize(emp.id)
    const dept = normalize(emp.departemen)
    return name.includes(q) || id.includes(q) || dept.includes(q)
  }).slice(0, limit)
}

export function formatEmployeeOption(emp) {
  return `${emp.name}, Departemen ${emp.departemen}, ID ${emp.id}`
}
