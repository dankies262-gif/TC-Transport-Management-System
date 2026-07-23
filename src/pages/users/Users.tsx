import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabase'
import StatusBadge from '../../components/StatusBadge'
import Modal from '../../components/Modal'
import type { Department, Location, Profile, Role, Section, Status } from '../../types'

export default function Users() {
  const [users, setUsers] = useState<Profile[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Profile | null>(null)
  const [form, setForm] = useState({
    id_number: '',
    contact_number: '',
    department_id: '',
    section_id: '',
    location_id: '',
    role_id: '',
    status: 'Active' as Status,
  })

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    const [{ data: u }, { data: r }, { data: dep }, { data: sec }, { data: loc }] = await Promise.all([
      supabase
        .from('profiles')
        .select('*, department:departments(*), section:sections(*), location:locations(*), role:roles(*)')
        .order('first_name'),
      supabase.from('roles').select('*').order('name'),
      supabase.from('departments').select('*').order('name'),
      supabase.from('sections').select('*').order('name'),
      supabase.from('locations').select('*').order('name'),
    ])
    setUsers((u as unknown as Profile[]) ?? [])
    setRoles((r as unknown as Role[]) ?? [])
    setDepartments((dep as unknown as Department[]) ?? [])
    setSections((sec as unknown as Section[]) ?? [])
    setLocations((loc as unknown as Location[]) ?? [])
    setLoading(false)
  }

  function openEdit(u: Profile) {
    setEditing(u)
    setForm({
      id_number: u.id_number ?? '',
      contact_number: u.contact_number ?? '',
      department_id: u.department_id ?? '',
      section_id: u.section_id ?? '',
      location_id: u.location_id ?? '',
      role_id: u.role_id ?? '',
      status: u.status,
    })
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!editing) return
    await supabase
      .from('profiles')
      .update({
        id_number: form.id_number || null,
        contact_number: form.contact_number || null,
        department_id: form.department_id || null,
        section_id: form.section_id || null,
        location_id: form.location_id || null,
        role_id: form.role_id || null,
        status: form.status,
      })
      .eq('id', editing.id)
    setEditing(null)
    load()
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl text-[var(--color-maroon-900)]">User Accounts</h1>
        <p className="text-sm text-ink-900/60 mt-0.5">
          Staff create their own login on the sign-up page — assign their role, department and office here.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-[var(--color-tan-300)] overflow-hidden">
        {loading ? (
          <p className="p-5 text-sm text-ink-900/50">Loading…</p>
        ) : users.length === 0 ? (
          <p className="p-5 text-sm text-ink-900/50">No user accounts yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-ink-900/50 bg-[var(--color-tan-100)]">
                <tr>
                  <th className="px-5 py-2.5">Name</th>
                  <th className="px-5 py-2.5">Username</th>
                  <th className="px-5 py-2.5">Role</th>
                  <th className="px-5 py-2.5">Department</th>
                  <th className="px-5 py-2.5">Office</th>
                  <th className="px-5 py-2.5">Status</th>
                  <th className="px-5 py-2.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-tan-200)]">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="px-5 py-3 font-medium">{u.first_name} {u.surname}</td>
                    <td className="px-5 py-3">{u.username}</td>
                    <td className="px-5 py-3">{u.role?.name ?? '—'}</td>
                    <td className="px-5 py-3">{u.department?.name ?? '—'}</td>
                    <td className="px-5 py-3">{u.location?.name ?? '—'}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={u.status} />
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button onClick={() => openEdit(u)} className="text-xs text-[var(--color-maroon-800)] hover:underline">
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <Modal title={`Edit ${editing.first_name} ${editing.surname}`} onClose={() => setEditing(null)} wide>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">ID number</label>
                <input
                  value={form.id_number}
                  onChange={(e) => setForm({ ...form, id_number: e.target.value })}
                  className="w-full rounded-lg border border-[var(--color-tan-300)] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Contact number</label>
                <input
                  value={form.contact_number}
                  onChange={(e) => setForm({ ...form, contact_number: e.target.value })}
                  className="w-full rounded-lg border border-[var(--color-tan-300)] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <select
                  value={form.role_id}
                  onChange={(e) => setForm({ ...form, role_id: e.target.value })}
                  className="w-full rounded-lg border border-[var(--color-tan-300)] px-3 py-2 text-sm"
                >
                  <option value="">—</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as Status })}
                  className="w-full rounded-lg border border-[var(--color-tan-300)] px-3 py-2 text-sm"
                >
                  <option>Active</option>
                  <option>Inactive</option>
                  <option>Suspended</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Department</label>
                <select
                  value={form.department_id}
                  onChange={(e) => setForm({ ...form, department_id: e.target.value })}
                  className="w-full rounded-lg border border-[var(--color-tan-300)] px-3 py-2 text-sm"
                >
                  <option value="">—</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Section</label>
                <select
                  value={form.section_id}
                  onChange={(e) => setForm({ ...form, section_id: e.target.value })}
                  className="w-full rounded-lg border border-[var(--color-tan-300)] px-3 py-2 text-sm"
                >
                  <option value="">—</option>
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Office / Location</label>
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
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="px-4 py-2.5 text-sm rounded-lg border border-[var(--color-tan-300)] hover:bg-[var(--color-tan-100)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2.5 text-sm rounded-lg bg-[var(--color-maroon-800)] hover:bg-[var(--color-maroon-900)] text-white font-medium"
              >
                Save changes
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
