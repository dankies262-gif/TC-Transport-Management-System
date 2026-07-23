import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabase'
import type { Location } from '../../types'

export default function Locations() {
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('locations').select('*').order('name')
    setLocations((data as unknown as Location[]) ?? [])
    setLoading(false)
  }

  async function addLocation(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const { error } = await supabase.from('locations').insert({ name, address: address || null })
    if (error) return setError(error.message)
    setName('')
    setAddress('')
    load()
  }

  async function removeLocation(l: Location) {
    if (!confirm(`Remove location "${l.name}"?`)) return
    await supabase.from('locations').delete().eq('id', l.id)
    load()
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl text-[var(--color-maroon-900)]">Locations</h1>
        <p className="text-sm text-ink-900/60 mt-0.5">Campuses and offices vehicles are based at.</p>
      </div>

      <div className="bg-white rounded-xl border border-[var(--color-tan-300)] overflow-hidden max-w-2xl">
        <form onSubmit={addLocation} className="p-4 border-b border-[var(--color-tan-200)] flex gap-2 flex-wrap">
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Main Campus"
            className="flex-1 min-w-[10rem] rounded-lg border border-[var(--color-tan-300)] px-3 py-2 text-sm"
          />
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Address (optional)"
            className="flex-1 min-w-[10rem] rounded-lg border border-[var(--color-tan-300)] px-3 py-2 text-sm"
          />
          <button className="px-3 py-2 rounded-lg bg-[var(--color-maroon-800)] hover:bg-[var(--color-maroon-900)] text-white text-sm font-medium">
            Add
          </button>
        </form>
        {error && <p className="px-4 pt-3 text-sm text-red-600">{error}</p>}
        {loading ? (
          <p className="p-4 text-sm text-ink-900/50">Loading…</p>
        ) : (
          <ul className="divide-y divide-[var(--color-tan-200)]">
            {locations.map((l) => (
              <li key={l.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <div>
                  <p className="font-medium">{l.name}</p>
                  {l.address && <p className="text-xs text-ink-900/50">{l.address}</p>}
                </div>
                <button onClick={() => removeLocation(l)} className="text-xs text-red-600 hover:underline">
                  Remove
                </button>
              </li>
            ))}
            {locations.length === 0 && <li className="px-5 py-4 text-sm text-ink-900/50">No locations yet.</li>}
          </ul>
        )}
      </div>
    </div>
  )
}
