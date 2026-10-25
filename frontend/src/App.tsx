import { Navigate, Route, Routes } from 'react-router'

import { AdminRoute } from './auth/AdminRoute'
import { useAuth } from './auth/AuthContext'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { AdminInventoryPage } from './pages/AdminInventoryPage'
import { BuyerInventoryPage } from './pages/BuyerInventoryPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'

export function AppRoutes() {
  const { user, isAdmin } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/" replace /> : <RegisterPage />} />
      <Route
        path="/"
        element={<ProtectedRoute>{isAdmin ? <Navigate to="/admin" replace /> : <BuyerInventoryPage />}</ProtectedRoute>}
      />
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminInventoryPage />
          </AdminRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
