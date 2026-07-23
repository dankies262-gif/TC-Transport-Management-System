import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import StatusBadge from '../../components/StatusBadge'
import Modal from '../../components/Modal'
import type { Booking, Profile, Vehicle } from '../../types'

export default function VehicleApprovals() {
  const { profile } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [drivers, setDrivers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [assignTarget, setAssignTarget] = useState<Booking | null>(null)
  const [declineTarget, setDeclineTarget] = useState<Booking | null>(null)
  const [selectedVehicle, setSelectedVehicle] = useState('')
  const [selectedDriver, setSelectedDriver] = useState('')
  const [declineReason, setDeclineReason] = useState('')

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    const [{ data: b }, { data: v }, { data: d }] = await Promise.all([
      supabase
        .from('bookings')
        .select(
          '*, requester:profiles!bookings_requester_id_fkey(*), vehicle:vehicles(*), driver:profiles!bookings_driver_id_fkey(*), department:departments(*)'
        )
        .in('status', ['Pending', 'Approved', 'Assigned'])
        .order('created_at', { ascending: false }),
      supabase.from('vehicles').select('*').eq('status', 'Available'),
      supabase.from('profiles').select('*, role:roles(*)'),
    ])
    setBookings((b as unknown as Booking[]) ?? [])
    setVehicles((v as unknown as Vehicle[]) ?? [])
    setDrivers(((d as unknown as Profile[]) ?? []).filter((p) => p.role?.name === 'Driver'))
    setLoading(false)
  }

  async function approve(booking: Booking) {
    await supabase
      .from('bookings')
      .update({ status: 'Approved', approved_by: profile!.id, approved_at: new Date().toISOString() })
      .eq('id', booking.id)
    load()
  }

  async function decline() {
    if (!declineTarget) return
    await supabase
      .from('bookings')
      .update({
        status: 'Declined',
        approved_by: profile!.id,
        approved_at: new Date().toISOString(),
        decline_reason: declineReason || null,
      })
      .eq('id', declineTarget.id)
    setDeclineTarget(null)
    setDeclineReason('')
    load()
  }

  async function assign() {
    if (!assignTarget || !selectedVehicle) return
    await supabase
      .from('bookings')
      .update({
        status: 'Assigned',
        vehicle_id: selectedVehicle,
        driver_id: selectedDriver || null,
      })
      .eq('id', assignTarget.id)
    await supabase.from('vehicles').update({ status: 'Booked' }).eq('id', selectedVehicle)
    setAssignTarget(null)
    setSelectedVehicle('')
    setSelectedDriver('')
    load()
  }

  return (
    <div>
      <h1 className="font-display text-2xl text-[var(--color-maroon-900)] mb-1">Vehicle Approvals</h1>
      <p className="text-sm text-ink-900/60 mb-6">Review requests, approve or decline, and assign a vehicle.</p>

      <div className="bg-white rounded-xl border border-[var(--color-tan-300)] overflow-hidden">
        {loading ? (
          <p className="p-5 text-sm text-ink-900/50">Loading…</p>
        ) : bookings.length === 0 ? (
          <p className="p-5 text-sm text-ink-900/50">Nothing waiting on you right now.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-ink-900/50 bg-[var(--color-tan-100)]">
                <tr>
                  <th className="px-5 py-2.5">Requester</th>
                  <th className="px-5 py-2.5">Department</th>
                  <th className="px-5 py-2.5">Purpose / Destination</th>
                  <th className="px-5 py-2.5">Departure</th>
                  <th className="px-5 py-2.5">Vehicle</th>
                  <th className="px-5 py-2.5">Status</th>
                  <th className="px-5 py-2.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-tan-200)]">
                {bookings.map((b) => (
                  <tr key={b.id}>
                    <td className="px-5 py-3">{b.requester ? `${b.requester.first_name} ${b.requester.surname}` : '—'}</td>
                    <td className="px-5 py-3">{b.department?.name ?? '—'}</td>
                    <td className="px-5 py-3">
                      <p className="font-medium">{b.purpose}</p>
                      <p className="text-ink-900/60 text-xs">{b.destination}</p>
                    </td>
                    <td className="px-5 py-3">
                      {b.departure_date} {b.departure_time ?? ''}
                    </td>
                    <td className="px-5 py-3">
                      {b.vehicle ? `${b.vehicle.make} ${b.vehicle.model}` : '—'}
                      {b.driver && <p className="text-xs text-ink-900/60">Driver: {b.driver.first_name} {b.driver.surname}</p>}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-2 flex-wrap">
                        {b.status === 'Pending' && (
                          <>
                            <button
                              onClick={() => approve(b)}
                              className="text-xs px-2.5 py-1.5 rounded-md bg-emerald-600 text-white hover:bg-emerald-700"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => setDeclineTarget(b)}
                              className="text-xs px-2.5 py-1.5 rounded-md border border-red-300 text-red-700 hover:bg-red-50"
                            >
                              Decline
                            </button>
                          </>
                        )}
                        {b.status === 'Approved' && (
                          <button
                            onClick={() => setAssignTarget(b)}
                            className="text-xs px-2.5 py-1.5 rounded-md bg-[var(--color-maroon-800)] text-white hover:bg-[var(--color-maroon-900)]"
                          >
                            Assign vehicle
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {assignTarget && (
        <Modal title="Assign vehicle" onClose={() => setAssignTarget(null)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Vehicle</label>
              <select
                value={selectedVehicle}
                onChange={(e) => setSelectedVehicle(e.target.value)}
                className="w-full rounded-lg border border-[var(--color-tan-300)] px-3 py-2 text-sm"
              >
                <option value="">Select a vehicle…</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.make} {v.model} — {v.registration_number}
                  </option>
                ))}
              </select>
              {vehicles.length === 0 && (
                <p className="text-xs text-amber-700 mt-1">No vehicles currently marked Available.</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Driver (optional)</label>
              <select
                value={selectedDriver}
                onChange={(e) => setSelectedDriver(e.target.value)}
                className="w-full rounded-lg border border-[var(--color-tan-300)] px-3 py-2 text-sm"
              >
                <option value="">Unassigned</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.first_name} {d.surname}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setAssignTarget(null)}
                className="px-4 py-2.5 text-sm rounded-lg border border-[var(--color-tan-300)] hover:bg-[var(--color-tan-100)]"
              >
                Cancel
              </button>
              <button
                onClick={assign}
                disabled={!selectedVehicle}
                className="px-4 py-2.5 text-sm rounded-lg bg-[var(--color-maroon-800)] hover:bg-[var(--color-maroon-900)] text-white font-medium disabled:opacity-50"
              >
                Assign
              </button>
            </div>
          </div>
        </Modal>
      )}

      {declineTarget && (
        <Modal title="Decline booking" onClose={() => setDeclineTarget(null)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Reason (optional)</label>
              <textarea
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-[var(--color-tan-300)] px-3 py-2 text-sm"
                placeholder="Let the requester know why"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setDeclineTarget(null)}
                className="px-4 py-2.5 text-sm rounded-lg border border-[var(--color-tan-300)] hover:bg-[var(--color-tan-100)]"
              >
                Cancel
              </button>
              <button
                onClick={decline}
                className="px-4 py-2.5 text-sm rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium"
              >
                Decline booking
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
