const STYLES: Record<string, string> = {
  Pending: 'bg-amber-100 text-amber-800',
  Approved: 'bg-emerald-100 text-emerald-800',
  Declined: 'bg-red-100 text-red-700',
  Assigned: 'bg-sky-100 text-sky-800',
  'In Progress': 'bg-indigo-100 text-indigo-800',
  Completed: 'bg-gray-200 text-gray-700',
  Cancelled: 'bg-gray-200 text-gray-500 line-through',
  Available: 'bg-emerald-100 text-emerald-800',
  Booked: 'bg-amber-100 text-amber-800',
  Maintenance: 'bg-orange-100 text-orange-800',
  'Out of Service': 'bg-red-100 text-red-700',
  Active: 'bg-emerald-100 text-emerald-800',
  Inactive: 'bg-gray-200 text-gray-600',
  Suspended: 'bg-red-100 text-red-700',
}

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
        STYLES[status] ?? 'bg-gray-100 text-gray-700'
      }`}
    >
      {status}
    </span>
  )
}
