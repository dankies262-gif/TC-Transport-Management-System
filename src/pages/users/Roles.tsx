import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabase'
import Modal from '../../components/Modal'
import type { Role } from '../../types'

const emptyForm = { name: '', description: '', can_approve: false, can_manage: false }

export default function Roles() {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Role | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('roles').select('*').order('name')
    setRoles((data as unknown as Role[]) ?? [])
    setLoading(false)
  }

  function openNew() {
    setEditing(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  function openEdit(r: Role) {
    setEditing(r)
    setForm({
      name: r.name,
      description: r.description ?? '',
      can_approve: r.can_approve,
      can_manage: r.can_manage,
    })
    setShowForm(true)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const payload = {
      name: form.name,
      description: form.description || null,
      can_approve: form.can_approve,
      can_manage: form.can_manage,
    }
    const { error } = editing
      ? await supabase.from('roles').update(payload).eq('id', editing.id)
      : await supabase.from('roles').insert(payload)
    if (error) {
      setError(error.message)
      return
    }
    setShowForm(false)
    load()
  }

  async function remove(r: Role) {
    if (!confirm(`Delete role "${r.name}"? Users with this role will lose their permissions.`)) return
    await supabase.from('roles').delete().eq('id', r.id)
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl text-[var(--color-maroon-900)]">User Roles</h1>
          <p className="text-sm text-ink-900/60 mt-0.5">Control who can approve bookings and manage configuration.</p>
        </div>
        <button
          onClick={openNew}
          className="rounded-lg bg-[var(--color-maroon-800)] hover:bg-[var(--color-maroon-900)] text-white text-sm font-medium px-4 py-2.5"
        >
          + Add role
        </button>
      </div>

      <div className="bg-white rounded-xl border border-[var(--color-tan-300)] overflow-hidden">
        {loading ? (
          <p className="p-5 text-sm text-ink-900/50">Loading…</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-ink-900/50 bg-[var(--color-tan-100)]">
              <tr>
                <th className="px-5 py-2.5">Role</th>
                <th className="px-5 py-2.5">Description</th>
                <th className="px-5 py-2.5">Can approve</th>
                <th className="px-5 py-2.5">Can manage</th>
                <th className="px-5 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-tan-200)]">
              {roles.map((r) => (
                <tr key={r.id}>
                  <td className="px-5 py-3 font-medium">{r.name}</td>
                  <td className="px-5 py-3 text-ink-900/70">{r.description ?? '—'}</td>
                  <td className="px-5 py-3">{r.can_approve ? 'Yes' : 'No'}</td>
                  <td className="px-5 py-3">{r.can_manage ? 'Yes' : 'No'}</td>
                  <td className="px-5 py-3 text-right space-x-3 whitespace-nowrap">
                    <button onClick={() => openEdit(r)} className="text-xs text-[var(--color-maroon-800)] hover:underline">
                      Edit
                    </button>
                    <button onClick={() => remove(r)} className="text-xs text-red-600 hover:underline">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <Modal title={editing ? 'Edit role' : 'Add role'} onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Role name</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border border-[var(--color-tan-300)] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full rounded-lg border border-[var(--color-tan-300)] px-3 py-2 text-sm"
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.can_approve}
                onChange={(e) => setForm({ ...form, can_approve: e.target.checked })}
              />
              Can approve or decline bookings
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.can_manage}
                onChange={(e) => setForm({ ...form, can_manage: e.target.checked })}
              />
              Can manage users, vehicles and configuration
            </label>
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
                {editing ? 'Save changes' : 'Add role'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
