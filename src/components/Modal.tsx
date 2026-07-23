import type { ReactNode } from 'react'
import { X } from 'lucide-react'

export default function Modal({
  title,
  onClose,
  children,
  wide = false,
}: {
  title: string
  onClose: () => void
  children: ReactNode
  wide?: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className={`relative bg-white rounded-xl shadow-lg w-full ${
          wide ? 'max-w-2xl' : 'max-w-md'
        } my-8`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-tan-300)]">
          <h2 className="font-display text-lg text-[var(--color-maroon-900)]">{title}</h2>
          <button onClick={onClose} className="text-ink-900/50 hover:text-ink-900">
            <X size={20} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}
