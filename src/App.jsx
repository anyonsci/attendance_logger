import { HashRouter, Route, Routes, Navigate } from 'react-router-dom'
import PersonListPage from './pages/PersonListPage'
import PersonSettingsPage from './pages/PersonSettingsPage'
import AttendanceCalendarPage from './pages/AttendanceCalendarPage'
import SignInPage from './pages/SignInPage'
import { GoogleOAuthProvider } from '@react-oauth/google';

function App() {
  const RequireAuth = ({ children }) => {
    const isAuthed = !!localStorage.getItem('auth_token')
    return isAuthed ? children : <Navigate to="/signin" replace />
  }

  return (
    <GoogleOAuthProvider clientId="719964045968-cmh03lg080igf8f4lh8ng70mhhbqtt3q.apps.googleusercontent.com">
      <HashRouter basename="">
        <div className="app-shell">
          <main className="content">
            <Routes>
              <Route path="/signin" element={<SignInPage />} />
              <Route path="/" element={<RequireAuth><PersonListPage /></RequireAuth>} />
              <Route path="/people" element={<RequireAuth><PersonListPage /></RequireAuth>} />
              <Route path="/people/:personId/calendar" element={<RequireAuth><AttendanceCalendarPage /></RequireAuth>} />
              <Route path="/people/:personId/settings" element={<RequireAuth><PersonSettingsPage /></RequireAuth>} />
            </Routes>
          </main>
        </div>
      </HashRouter>
    </GoogleOAuthProvider>
  )
}

export default App
