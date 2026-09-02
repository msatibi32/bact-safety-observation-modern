import { useEffect, useRef, useState } from 'react'
import { formatEmployeeOption, searchEmployees } from '../lib/employees'

export default function EmployeeNameField({
  name,
  employeeId,
  onSelectEmployee,
  onChangeName,
}) {
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const wrapRef = useRef(null)
  const results = searchEmployees(name)

  useEffect(() => {
    function handleClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function pick(emp) {
    onSelectEmployee(emp)
    setOpen(false)
  }

  function handleChange(e) {
    onChangeName(e.target.value)
    setOpen(true)
    setHighlight(0)
  }

  function handleKeyDown(e) {
    if (!open || results.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight((i) => (i + 1) % results.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((i) => (i - 1 + results.length) % results.length)
    } else if (e.key === 'Enter' && results[highlight]) {
      e.preventDefault()
      pick(results[highlight])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const selected = Boolean(employeeId)

  return (
    <div ref={wrapRef} className="relative">
      <input
        type="text"
        required
        autoComplete="off"
        value={name}
        onChange={handleChange}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        className="input"
        placeholder="Ketik nama karyawan BACT"
      />

      {selected && (
        <p className="mt-1.5 text-xs font-medium text-emerald-700">
          Terpilih dari data karyawan — ID {employeeId}
        </p>
      )}

      {open && name.trim() && (
        <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
          {results.length > 0 ? (
            results.map((emp, i) => (
              <li key={emp.id}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(emp)}
                  className={`flex w-full flex-col items-start px-3.5 py-2.5 text-left text-sm ${
                    i === highlight ? 'bg-brand-50 text-brand-800' : 'text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <span className="font-medium">{emp.name}</span>
                  <span className="text-xs text-slate-500">{formatEmployeeOption(emp)}</span>
                </button>
              </li>
            ))
          ) : (
            <li className="px-3.5 py-2.5 text-xs text-slate-500">
              Nama belum ada di data karyawan. Isi manual dulu — daftar lengkap menyusul.
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
