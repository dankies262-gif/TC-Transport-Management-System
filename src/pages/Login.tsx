import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    navigate('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top,_var(--color-tan-200),_var(--color-tan-100))] px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <img src="/logo.png" alt="Triumphant College" className="h-20 w-20 object-contain mb-3" />
          <h1 className="font-display text-2xl text-[var(--color-maroon-900)] text-center leading-tight">
            Triumphant College
          </h1>
          <p className="text-sm tracking-wide text-[var(--color-gold-600)] uppercase mt-1">
            Transport Management
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white/80 backdrop-blur border border-[var(--color-tan-300)] rounded-xl shadow-sm p-6"
        >
          <label className="block text-sm font-medium text-[var(--color-ink-900)] mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full mb-4 rounded-lg border border-[var(--color-tan-300)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-maroon-700)]"
            placeholder="you@triumphantcollege.edu.na"
          />
          <label className="block text-sm font-medium text-[var(--color-ink-900)] mb-1">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full mb-4 rounded-lg border border-[var(--color-tan-300)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-maroon-700)]"
            placeholder="••••••••"
          />

          {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[var(--color-maroon-800)] hover:bg-[var(--color-maroon-900)] text-white text-sm font-medium py-2.5 transition-colors disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="text-center text-xs text-[var(--color-ink-900)]/60 mt-6">
          Accounts are created by the Transport Office. Contact IT if you can't sign in.
        </p>
      </div>
    </div>
  )
}
