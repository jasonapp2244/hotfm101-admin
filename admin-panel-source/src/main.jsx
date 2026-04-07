import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import './index.css'
import { AuthProvider, useAuth, canAccess } from './contexts/AuthContext'
import { DataProvider } from './contexts/DataContext'
import { ToastProvider } from './contexts/ToastContext'
import ToastContainer from './components/Toast'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Users from './pages/Users'
import Content from './pages/Content'
import Contests from './pages/Contests'
import Events from './pages/Events'
import Shoutouts from './pages/Shoutouts'
import Notifications from './pages/Notifications'
import Ads from './pages/Ads'
import Broadcasting from './pages/Broadcasting'
import AdAnalytics from './pages/AdAnalytics'

// Requires login AND role permission for the route
function ProtectedRoute({ children }) {
  const { isAuthenticated, user } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Check if current role can access this path
  if (!canAccess(user?.roleNorm, location.pathname)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* All roles that pass ProtectedRoute see Dashboard */}
      <Route path="/dashboard"      element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

      {/* Admin / Super Admin only */}
      <Route path="/users"          element={<ProtectedRoute><Users /></ProtectedRoute>} />
      <Route path="/notifications"  element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
      <Route path="/ads"            element={<ProtectedRoute><Ads /></ProtectedRoute>} />
      <Route path="/ads/analytics"  element={<ProtectedRoute><AdAnalytics /></ProtectedRoute>} />

      {/* Admin + Editor */}
      <Route path="/content"        element={<ProtectedRoute><Content /></ProtectedRoute>} />
      <Route path="/contests"       element={<ProtectedRoute><Contests /></ProtectedRoute>} />
      <Route path="/events"         element={<ProtectedRoute><Events /></ProtectedRoute>} />

      {/* Admin + Staff */}
      <Route path="/shoutouts"      element={<ProtectedRoute><Shoutouts /></ProtectedRoute>} />
      <Route path="/broadcasting"   element={<ProtectedRoute><Broadcasting /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <DataProvider>
          <ToastProvider>
            <AppRoutes />
            <ToastContainer />
          </ToastProvider>
        </DataProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
