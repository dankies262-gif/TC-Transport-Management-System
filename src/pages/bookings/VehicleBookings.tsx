import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import StatusBadge from '../../components/StatusBadge'
import Modal from '../../components/Modal'
import type { Booking } from '../../types'

const emptyForm = {
  purpose: '',
  destination: '',
  departure_date: '',
  departure_time: '',
  return_date: '',
  return_time: '',
  no_of_passengers: 1,
  notes: '',
}

export default function VehicleBookings() {
  const { profile, isApprover } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({ pending: 0, upcoming: 0, available: 0 })

  useEffect(() => {
    if (profile) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile])

  async function load() {
    setLoading(true)
    const query = isApprover
      ? supabase.from('bookings').select('*, requester:profiles!bookings_requester_id_fkey(*), vehicle:vehicles(*)')
      : supabase
          .from('bookings')
          .select('*, requester:profiles!bookings_requester_id_fkey(*), vehicle:vehicles(*)')
          .eq('requester_id', profile!.id)

    const [{ data: bookingData }, { count: pendingCount }, { count: availableCount }] = await Promise.all([
      query.order('created_at', { ascending: false }),
      supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'Pending'),
      supabase.from('vehicles').select('*', { count: 'exact', head: true }).eq('status', 'Available'),
    ])

    const list = (bookingData as unknown as Booking[]) ?? []
    setBookings(list)
    setStats({
      pending: pendingCount ?? 0,
      upcoming: list.filter((b) => ['Approved', 'Assigned'].includes(b.status)).length,
      available: availableCount ?? 0,
    })
    setLoading(false)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const { error } = await supabase.from('bookings').insert({
      requester_id: profile!.id,
      purpose: form.purpose,
      destination: form.destination,
      departure_date: form.departure_date,
      departure_time: form.departure_time || null,
      return_date: form.return_date || null,
      return_time: form.return_time || null,
      no_of_passengers: form.no_of_passengers,
      department_id: profile!.department_id,
      notes: form.notes || null,
    })
    setSaving(false)
    if (error) {
      setError(error.message)
      return
    }
    setShowForm(false)
    setForm(emptyForm)
    load()
  }

  async function cancelBooking(id: string) {
    if (!confirm('Cancel this booking request?')) return
    await supabase.from('bookings').update({ status: 'Cancelled' }).eq('id', id)
    load()
  }

  const cards = [
    { label: 'Pending Approvals', value: stats.pending, color: 'text-amber-700' },
    { label: 'Upcoming Trips', value: stats.upcoming, color: 'text-sky-700' },
    { label: 'Vehicles Available', value: stats.available, color: 'text-emerald-700' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-3">
        <div>
          <h1 className="font-display text-2xl text-[var(--color-maroon-900)]">
            Welcome{profile ? `, ${profile.first_name}` : ''}
          </h1>
          <p className="text-sm text-ink-900/60 mt-0.5">Vehicle bookings across campus.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="shrink-0 rounded-lg bg-[var(--color-maroon-800)] hover:bg-[var(--color-maroon-900)] text-white text-sm font-medium px-4 py-2.5 transition-colors"
        >
          + New booking
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-xl border border-[var(--color-tan-300)] p-4">
            <p className="text-xs uppercase tracking-wide text-ink-900/50">{c.label}</p>
            <p className={`font-display text-3xl mt-1 ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-[var(--color-tan-300)] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[var(--color-tan-300)]">
          <h2 className="font-medium text-sm">{isApprover ? 'All bookings' : 'My bookings'}</h2>
        </div>
        {loading ? (
          <p className="p-5 text-sm text-ink-900/50">Loading…</p>
        ) : bookings.length === 0 ? (
          <p className="p-5 text-sm text-ink-900/50">No bookings yet — create one above.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-ink-900/50 bg-[var(--color-tan-100)]">
                <tr>
                  {isApprover && <th className="px-5 py-2.5">Requester</th>}
                  <th className="px-5 py-2.5">Purpose</th>
                  <th className="px-5 py-2.5">Destination</th>
                  <th className="px-5 py-2.5">Departure</th>
                  <th className="px-5 py-2.5">Vehicle</th>
                  <th className="px-5 py-2.5">Status</th>
                  <th className="px-5 py-2.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-tan-200)]">
                {bookings.map((b) => (
                  <tr key={b.id}>
                    {isApprover && (
                      <td className="px-5 py-3">
                        {b.requester ? `${b.requester.first_name} ${b.requester.surname}` : '—'}
                      </td>
                    )}
                    <td className="px-5 py-3">{b.purpose}</td>
                    <td className="px-5 py-3">{b.destination}</td>
                    <td className="px-5 py-3">
                      {b.departure_date} {b.departure_time ?? ''}
                    </td>
                    <td className="px-5 py-3">{b.vehicle ? `${b.vehicle.make} ${b.vehicle.model}` : '—'}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="px-5 py-3 text-right">
                      {b.requester_id === profile?.id && b.status === 'Pending' && (
                        <button
                          onClick={() => cancelBooking(b.id)}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <Modal title="New vehicle booking" onClose={() => setShowForm(false)} wide>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Purpose of trip</label>
              <input
                required
                value={form.purpose}
                onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                className="w-full rounded-lg border border-[var(--color-tan-300)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-maroon-700)]"
                placeholder="e.g. Field trip to Etosha, sports fixture, admin errand"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Destination</label>
              <input
                required
                value={form.destination}
                onChange={(e) => setForm({ ...form, destination: e.target.value })}
                className="w-full rounded-lg border border-[var(--color-tan-300)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-maroon-700)]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Departure date</label>
                <input
                  type="date"
                  required
                  value={form.departure_date}
                  onChange={(e) => setForm({ ...form, departure_date: e.target.value })}
                  className="w-full rounded-lg border border-[var(--color-tan-300)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-maroon-700)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Departure time</label>
                <input
                  type="time"
                  value={form.departure_time}
                  onChange={(e) => setForm({ ...form, departure_time: e.target.value })}
                  className="w-full rounded-lg border border-[var(--color-tan-300)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-maroon-700)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Return date</label>
                <input
                  type="date"
                  value={form.return_date}
                  onChange={(e) => setForm({ ...form, return_date: e.target.value })}
                  className="w-full rounded-lg border border-[var(--color-tan-300)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-maroon-700)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Return time</label>
                <input
                  type="time"
                  value={form.return_time}
                  onChange={(e) => setForm({ ...form, return_time: e.target.value })}
                  className="w-full rounded-lg border border-[var(--color-tan-300)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-maroon-700)]"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Number of passengers</label>
              <input
                type="number"
                min={1}
                required
                value={form.no_of_passengers}
                onChange={(e) => setForm({ ...form, no_of_passengers: Number(e.target.value) })}
                className="w-full rounded-lg border border-[var(--color-tan-300)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-maroon-700)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Notes (optional)</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
                className="w-full rounded-lg border border-[var(--color-tan-300)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-maroon-700)]"
              />
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
                disabled={saving}
                className="px-4 py-2.5 text-sm rounded-lg bg-[var(--color-maroon-800)] hover:bg-[var(--color-maroon-900)] text-white font-medium disabled:opacity-60"
              >
                {saving ? 'Submitting…' : 'Submit request'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
