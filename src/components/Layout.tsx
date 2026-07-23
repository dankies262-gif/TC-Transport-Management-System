import { useState, type ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  CalendarCheck,
  ClipboardCheck,
  Users,
  MapPin,
  Car,
  ChevronDown,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

interface NavItemProps {
  to: string
  icon: ReactNode
  label: string
}

function NavItem({ to, icon, label }: NavItemProps) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-2.5 px-4 py-2.5 text-sm rounded-lg mx-2 transition-colors ${
          isActive
            ? 'bg-white/15 text-white font-medium'
            : 'text-tan-200/85 hover:bg-white/10 hover:text-white'
        }`
      }
    >
      {icon}
      {label}
    </NavLink>
  )
}

function NavGroup({
  icon,
  label,
  children,
}: {
  icon: ReactNode
  label: string
  children: ReactNode
}) {
  const [open, setOpen] = useState(true)
  return (
    <div className="mb-1">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2.5 px-4 py-2.5 text-sm rounded-lg mx-0 text-tan-200/85 hover:bg-white/10 hover:text-white transition-colors"
      >
        <span className="flex items-center gap-2.5">
          {icon}
          {label}
        </span>
        <ChevronDown size={15} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="ml-2 border-l border-white/10 pl-1 mt-1 space-y-0.5">{children}</div>}
    </div>
  )
}

export default function Layout({ children }: { children: ReactNode }) {
  const { profile, isApprover, isManager, signOut } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  const sidebar = (
    <div className="w-64 shrink-0 bg-[var(--color-maroon-900)] min-h-screen flex flex-col">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <img src="/logo.png" alt="" className="h-9 w-9 object-contain" />
        <div>
          <p className="font-display text-white text-sm leading-tight">Triumphant College</p>
          <p className="text-[11px] uppercase tracking-wide text-[var(--color-gold-500)]">Transport</p>
        </div>
      </div>

      <nav className="flex-1 py-4 space-y-1">
        <NavItem to="/" icon={<CalendarCheck size={17} />} label="Vehicle Bookings" />
        {isApprover && (
          <NavItem to="/approvals" icon={<ClipboardCheck size={17} />} label="Vehicle Approvals" />
        )}
        {isManager && (
          <>
            <NavGroup icon={<Users size={17} />} label="User Configurations">
              <NavItem to="/users" icon={<span className="w-1.5" />} label="User Accounts" />
              <NavItem to="/roles" icon={<span className="w-1.5" />} label="User Roles" />
            </NavGroup>
            <NavGroup icon={<MapPin size={17} />} label="Location Configurations">
              <NavItem to="/locations" icon={<span className="w-1.5" />} label="Locations" />
              <NavItem to="/departments" icon={<span className="w-1.5" />} label="Departments" />
            </NavGroup>
            <NavGroup icon={<Car size={17} />} label="Vehicle Configurations">
              <NavItem to="/vehicles" icon={<span className="w-1.5" />} label="Vehicles" />
            </NavGroup>
          </>
        )}
      </nav>

      <div className="border-t border-white/10 px-4 py-4">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2 text-sm text-tan-200/85 hover:text-white transition-colors"
        >
          <LogOut size={16} />
          Log out
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-[var(--color-tan-100)]">
      {/* Desktop sidebar */}
      <div className="hidden md:block">{sidebar}</div>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="relative z-10">{sidebar}</div>
        </div>
      )}

      <div className="flex-1 min-w-0">
        <header className="h-16 bg-white border-b border-[var(--color-tan-300)] flex items-center justify-between px-4 md:px-6">
          <button className="md:hidden" onClick={() => setMobileOpen(true)}>
            <Menu size={22} />
          </button>
          <div className="hidden md:block" />
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium leading-tight">
                {profile ? `${profile.first_name} ${profile.surname}` : ''}
              </p>
              <p className="text-xs text-ink-900/60">{profile?.role?.name}</p>
            </div>
            <div className="h-9 w-9 rounded-full bg-[var(--color-maroon-800)] text-white flex items-center justify-center text-sm font-medium">
              {profile ? profile.first_name[0] + profile.surname[0] : '?'}
            </div>
          </div>
        </header>
        {mobileOpen && (
          <button
            className="md:hidden absolute top-4 right-4 text-white z-50"
            onClick={() => setMobileOpen(false)}
          >
            <X size={22} />
          </button>
        )}
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
