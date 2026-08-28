import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldIcon } from '../components/Icon'
import { login } from '../lib/auth'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/admin')
    } catch {
      setError('Email atau password salah.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-violet-50 via-white to-white px-4">
      <div className="mb-6 flex flex-col items-center text-center">
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-indigo-600/30">
          <ShieldIcon className="h-7 w-7" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-wider text-violet-600">
          BACT · Safety Observation Card
        </p>
        <h1 className="mt-1 text-xl font-bold text-slate-900">Login Admin / HSE Officer</h1>
      </div>
      <form onSubmit={handleSubmit} className="card w-full max-w-sm space-y-4 p-6">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            placeholder="nama@bact.co.id"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">Password</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            placeholder="••••••••"
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Masuk…' : 'Masuk'}
        </button>
      </form>
    </div>
  )
}
