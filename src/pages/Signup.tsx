import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Signup() {
  const [form, setForm] = useState({
    email: '',
    password: '',
    username: '',
    first_name: '',
    surname: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          username: form.username,
          first_name: form.first_name,
          surname: form.surname,
        },
      },
    })
    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    setDone(true)
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-tan-100)] px-4">
        <div className="max-w-sm text-center">
          <img src="/logo.png" alt="" className="h-16 w-16 object-contain mx-auto mb-4" />
          <h1 className="font-display text-xl text-[var(--color-maroon-900)] mb-2">Check your email</h1>
          <p className="text-sm text-ink-900/70 mb-6">
            Confirm your address, then sign in. The Transport Office will assign your department and access
            once your account is active.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="rounded-lg bg-[var(--color-maroon-800)] hover:bg-[var(--color-maroon-900)] text-white text-sm font-medium px-4 py-2.5"
          >
            Back to sign in
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top,_var(--color-tan-200),_var(--color-tan-100))] px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <img src="/logo.png" alt="Triumphant College" className="h-16 w-16 object-contain mb-3" />
          <h1 className="font-display text-xl text-[var(--color-maroon-900)] text-center">Create your account</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur border border-[var(--color-tan-300)] rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">First name</label>
              <input
                required
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                className="w-full rounded-lg border border-[var(--color-tan-300)] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Surname</label>
              <input
                required
                value={form.surname}
                onChange={(e) => setForm({ ...form, surname: e.target.value })}
                className="w-full rounded-lg border border-[var(--color-tan-300)] px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Username</label>
            <input
              required
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="w-full rounded-lg border border-[var(--color-tan-300)] px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-lg border border-[var(--color-tan-300)] px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full rounded-lg border border-[var(--color-tan-300)] px-3 py-2 text-sm"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[var(--color-maroon-800)] hover:bg-[var(--color-maroon-900)] text-white text-sm font-medium py-2.5 disabled:opacity-60"
          >
            {loading ? 'Creating…' : 'Create account'}
          </button>
        </form>
        <p className="text-center text-xs text-ink-900/60 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-[var(--color-maroon-800)] font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
