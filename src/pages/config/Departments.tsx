import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabase'
import type { Department, Section } from '../../types'

export default function Departments() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [loading, setLoading] = useState(true)
  const [newDept, setNewDept] = useState('')
  const [newSection, setNewSection] = useState('')
  const [newSectionDept, setNewSectionDept] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    const [{ data: d }, { data: s }] = await Promise.all([
      supabase.from('departments').select('*').order('name'),
      supabase.from('sections').select('*, department:departments(*)').order('name'),
    ])
    setDepartments((d as unknown as Department[]) ?? [])
    setSections((s as unknown as Section[]) ?? [])
    setLoading(false)
  }

  async function addDepartment(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const { error } = await supabase.from('departments').insert({ name: newDept })
    if (error) return setError(error.message)
    setNewDept('')
    load()
  }

  async function removeDepartment(d: Department) {
    if (!confirm(`Remove department "${d.name}"?`)) return
    await supabase.from('departments').delete().eq('id', d.id)
    load()
  }

  async function addSection(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const { error } = await supabase
      .from('sections')
      .insert({ name: newSection, department_id: newSectionDept || null })
    if (error) return setError(error.message)
    setNewSection('')
    load()
  }

  async function removeSection(s: Section) {
    if (!confirm(`Remove section "${s.name}"?`)) return
    await supabase.from('sections').delete().eq('id', s.id)
    load()
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl text-[var(--color-maroon-900)]">Departments &amp; Sections</h1>
        <p className="text-sm text-ink-900/60 mt-0.5">Used to route bookings and organise staff accounts.</p>
      </div>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-[var(--color-tan-300)] overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[var(--color-tan-300)]">
            <h2 className="font-medium text-sm">Departments</h2>
          </div>
          <form onSubmit={addDepartment} className="flex gap-2 p-4 border-b border-[var(--color-tan-200)]">
            <input
              required
              value={newDept}
              onChange={(e) => setNewDept(e.target.value)}
              placeholder="e.g. Faculty of Business"
              className="flex-1 rounded-lg border border-[var(--color-tan-300)] px-3 py-2 text-sm"
            />
            <button className="px-3 py-2 rounded-lg bg-[var(--color-maroon-800)] hover:bg-[var(--color-maroon-900)] text-white text-sm font-medium">
              Add
            </button>
          </form>
          {loading ? (
            <p className="p-4 text-sm text-ink-900/50">Loading…</p>
          ) : (
            <ul className="divide-y divide-[var(--color-tan-200)]">
              {departments.map((d) => (
                <li key={d.id} className="flex items-center justify-between px-5 py-2.5 text-sm">
                  {d.name}
                  <button onClick={() => removeDepartment(d)} className="text-xs text-red-600 hover:underline">
                    Remove
                  </button>
                </li>
              ))}
              {departments.length === 0 && <li className="px-5 py-4 text-sm text-ink-900/50">No departments yet.</li>}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-xl border border-[var(--color-tan-300)] overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[var(--color-tan-300)]">
            <h2 className="font-medium text-sm">Sections</h2>
          </div>
          <form onSubmit={addSection} className="p-4 border-b border-[var(--color-tan-200)] space-y-2">
            <input
              required
              value={newSection}
              onChange={(e) => setNewSection(e.target.value)}
              placeholder="e.g. Admissions"
              className="w-full rounded-lg border border-[var(--color-tan-300)] px-3 py-2 text-sm"
            />
            <div className="flex gap-2">
              <select
                value={newSectionDept}
                onChange={(e) => setNewSectionDept(e.target.value)}
                className="flex-1 rounded-lg border border-[var(--color-tan-300)] px-3 py-2 text-sm"
              >
                <option value="">No parent department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <button className="px-3 py-2 rounded-lg bg-[var(--color-maroon-800)] hover:bg-[var(--color-maroon-900)] text-white text-sm font-medium">
                Add
              </button>
            </div>
          </form>
          {loading ? (
            <p className="p-4 text-sm text-ink-900/50">Loading…</p>
          ) : (
            <ul className="divide-y divide-[var(--color-tan-200)]">
              {sections.map((s) => (
                <li key={s.id} className="flex items-center justify-between px-5 py-2.5 text-sm">
                  <span>
                    {s.name}
                    {s.department_id && (
                      <span className="text-ink-900/50"> — {departments.find((d) => d.id === s.department_id)?.name}</span>
                    )}
                  </span>
                  <button onClick={() => removeSection(s)} className="text-xs text-red-600 hover:underline">
                    Remove
                  </button>
                </li>
              ))}
              {sections.length === 0 && <li className="px-5 py-4 text-sm text-ink-900/50">No sections yet.</li>}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
