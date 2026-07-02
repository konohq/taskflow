import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/useAuth'

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600">
        Loading...
      </main>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}
