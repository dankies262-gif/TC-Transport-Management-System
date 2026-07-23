import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabase'
import StatusBadge from '../../components/StatusBadge'
import Modal from '../../components/Modal'
import type { Location, Vehicle, VehicleStatus } from '../../types'

const emptyForm = {
  registration_number: '',
  make: '',
  model: '',
  year: new Date().getFullYear(),
  no_of_passengers: 5,
  km: 0,
  location_id: '',
  status: 'Available' as VehicleStatus,
}

export default function Vehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Vehicle | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    const [{ data: v }, { data: l }] = await Promise.all([
      supabase.from('vehicles').select('*, location:locations(*)').order('registration_number'),
      supabase.from('locations').select('*').order('name'),
    ])
    setVehicles((v as unknown as Vehicle[]) ?? [])
    setLocations((l as unknown as Location[]) ?? [])
    setLoading(false)
  }

  function openNew() {
    setEditing(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  function openEdit(v: Vehicle) {
    setEditing(v)
    setForm({
      registration_number: v.registration_number,
      make: v.make,
      model: v.model,
      year: v.year ?? new Date().getFullYear(),
      no_of_passengers: v.no_of_passengers ?? 5,
      km: v.km,
      location_id: v.location_id ?? '',
      status: v.status,
    })
    setShowForm(true)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const payload = {
      registration_number: form.registration_number,
      make: form.make,
      model: form.model,
      year: form.year,
      no_of_passengers: form.no_of_passengers,
      km: form.km,
      location_id: form.location_id || null,
      status: form.status,
    }
    const { error } = editing
      ? await supabase.from('vehicles').update(payload).eq('id', editing.id)
      : await supabase.from('vehicles').insert(payload)
    if (error) {
      setError(error.message)
      return
    }
    setShowForm(false)
    load()
  }

  async function remove(v: Vehicle) {
    if (!confirm(`Remove ${v.make} ${v.model} (${v.registration_number})?`)) return
    await supabase.from('vehicles').delete().eq('id', v.id)
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl text-[var(--color-maroon-900)]">Vehicles</h1>
          <p className="text-sm text-ink-900/60 mt-0.5">The college fleet.</p>
        </div>
        <button
          onClick={openNew}
          className="rounded-lg bg-[var(--color-maroon-800)] hover:bg-[var(--color-maroon-900)] text-white text-sm font-medium px-4 py-2.5"
        >
          + Add vehicle
        </button>
      </div>

      <div className="bg-white rounded-xl border border-[var(--color-tan-300)] overflow-hidden">
        {loading ? (
          <p className="p-5 text-sm text-ink-900/50">Loading…</p>
        ) : vehicles.length === 0 ? (
          <p className="p-5 text-sm text-ink-900/50">No vehicles yet — add the first one.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-ink-900/50 bg-[var(--color-tan-100)]">
                <tr>
                  <th className="px-5 py-2.5">Registration</th>
                  <th className="px-5 py-2.5">Make</th>
                  <th className="px-5 py-2.5">Model</th>
                  <th className="px-5 py-2.5">Year</th>
                  <th className="px-5 py-2.5">Km</th>
                  <th className="px-5 py-2.5">Seats</th>
                  <th className="px-5 py-2.5">Location</th>
                  <th className="px-5 py-2.5">Status</th>
                  <th className="px-5 py-2.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-tan-200)]">
                {vehicles.map((v) => (
                  <tr key={v.id}>
                    <td className="px-5 py-3 font-medium">{v.registration_number}</td>
                    <td className="px-5 py-3">{v.make}</td>
                    <td className="px-5 py-3">{v.model}</td>
                    <td className="px-5 py-3">{v.year}</td>
                    <td className="px-5 py-3">{v.km.toLocaleString()}</td>
                    <td className="px-5 py-3">{v.no_of_passengers}</td>
                    <td className="px-5 py-3">{v.location?.name ?? '—'}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={v.status} />
                    </td>
                    <td className="px-5 py-3 text-right space-x-3 whitespace-nowrap">
                      <button onClick={() => openEdit(v)} className="text-xs text-[var(--color-maroon-800)] hover:underline">
                        Edit
                      </button>
                      <button onClick={() => remove(v)} className="text-xs text-red-600 hover:underline">
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <Modal title={editing ? 'Edit vehicle' : 'Add vehicle'} onClose={() => setShowForm(false)} wide>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Registration number</label>
                <input
                  required
                  value={form.registration_number}
                  onChange={(e) => setForm({ ...form, registration_number: e.target.value })}
                  className="w-full rounded-lg border border-[var(--color-tan-300)] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as VehicleStatus })}
                  className="w-full rounded-lg border border-[var(--color-tan-300)] px-3 py-2 text-sm"
                >
                  <option>Available</option>
                  <option>Booked</option>
                  <option>Maintenance</option>
                  <option>Out of Service</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Make</label>
                <input
                  required
                  value={form.make}
                  onChange={(e) => setForm({ ...form, make: e.target.value })}
                  className="w-full rounded-lg border border-[var(--color-tan-300)] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Model</label>
                <input
                  required
                  value={form.model}
                  onChange={(e) => setForm({ ...form, model: e.target.value })}
                  className="w-full rounded-lg border border-[var(--color-tan-300)] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Year</label>
                <input
                  type="number"
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
                  className="w-full rounded-lg border border-[var(--color-tan-300)] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Odometer (km)</label>
                <input
                  type="number"
                  value={form.km}
                  onChange={(e) => setForm({ ...form, km: Number(e.target.value) })}
                  className="w-full rounded-lg border border-[var(--color-tan-300)] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Passenger seats</label>
                <input
                  type="number"
                  value={form.no_of_passengers}
                  onChange={(e) => setForm({ ...form, no_of_passengers: Number(e.target.value) })}
                  className="w-full rounded-lg border border-[var(--color-tan-300)] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Home location</label>
                <select
                  value={form.location_id}
                  onChange={(e) => setForm({ ...form, location_id: e.target.value })}
                  className="w-full rounded-lg border border-[var(--color-tan-300)] px-3 py-2 text-sm"
                >
                  <option value="">—</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2.5 text-sm rounded-lg border border-[var(--color-tan-300)] hover:bg-[var(--color-tan-100)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2.5 text-sm rounded-lg bg-[var(--color-maroon-800)] hover:bg-[var(--color-maroon-900)] text-white font-medium"
              >
                {editing ? 'Save changes' : 'Add vehicle'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
