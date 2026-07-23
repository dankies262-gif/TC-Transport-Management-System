import type { ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Signup from './pages/Signup'
import VehicleBookings from './pages/bookings/VehicleBookings'
import VehicleApprovals from './pages/approvals/VehicleApprovals'
import Vehicles from './pages/vehicles/Vehicles'
import Users from './pages/users/Users'
import Roles from './pages/users/Roles'
import Departments from './pages/config/Departments'
import Locations from './pages/config/Locations'

function Protected({ children, requireManager = false, requireApprover = false }: {
  children: ReactNode
  requireManager?: boolean
  requireApprover?: boolean
}) {
  const { session, profile, loading, isManager, isApprover } = useAuth()
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-ink-900/50">Loading…</div>
  }
  if (!session) return <Navigate to="/login" replace />
  if (!profile) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-ink-900/50">Setting up your profile…</div>
  }
  if (requireManager && !isManager) return <Navigate to="/" replace />
  if (requireApprover && !isApprover) return <Navigate to="/" replace />
  return <Layout>{children}</Layout>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/" element={<Protected><VehicleBookings /></Protected>} />
      <Route
        path="/approvals"
        element={
          <Protected requireApprover>
            <VehicleApprovals />
          </Protected>
        }
      />
      <Route
        path="/vehicles"
        element={
          <Protected requireManager>
            <Vehicles />
          </Protected>
        }
      />
      <Route
        path="/users"
        element={
          <Protected requireManager>
            <Users />
          </Protected>
        }
      />
      <Route
        path="/roles"
        element={
          <Protected requireManager>
            <Roles />
          </Protected>
        }
      />
      <Route
        path="/departments"
        element={
          <Protected requireManager>
            <Departments />
          </Protected>
        }
      />
      <Route
        path="/locations"
        element={
          <Protected requireManager>
            <Locations />
          </Protected>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
