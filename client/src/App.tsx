import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthContext'
import AppShell from './components/AppShell'
import SetupPage from './pages/SetupPage'
import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import UserManagementPage from './pages/UserManagementPage'
import AcceptInvitePage from './pages/AcceptInvitePage'
import ResetPasswordPage from './pages/ResetPasswordPage'

function FullScreenMessage({ children }: { children: string }) {
  return (
    <div className="min-h-screen bg-[#0b111a] flex items-center justify-center">
      <p className="text-sm text-[#8593a8]">{children}</p>
    </div>
  )
}

function RequireAuth() {
  const { user, loading } = useAuth()
  if (loading) return <FullScreenMessage>Restoring your session…</FullScreenMessage>
  if (!user) return <Navigate to="/login" replace />
  return <Outlet />
}

function RequireAdmin() {
  const { user } = useAuth()
  if (user?.role !== 'admin') {
    return (
      <div className="px-8 py-16 text-center">
        <h1 className="text-xl font-bold text-[#e5eaf2]">Administrators only</h1>
        <p className="mt-2 text-sm text-[#8593a8]">
          Your role doesn't have access to this page.
        </p>
      </div>
    )
  }
  return <Outlet />
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/setup" element={<SetupPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/accept-invite" element={<AcceptInvitePage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          <Route element={<RequireAuth />}>
            <Route element={<AppShell />}>
              <Route path="/profile" element={<ProfilePage />} />
              <Route element={<RequireAdmin />}>
                <Route path="/settings/users" element={<UserManagementPage />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/settings/users" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
