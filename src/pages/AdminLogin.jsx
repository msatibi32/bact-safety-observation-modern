import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BrandHeader from '../components/BrandHeader'
import ThemeToggle from '../components/ThemeToggle'
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
      setError('Wrong email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-auth relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-brand-50 via-white to-white px-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <BrandHeader className="mb-6" title="Admin / HSE Officer login" size="md" />
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
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
