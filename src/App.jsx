import { HashRouter, Route, Routes, Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import ReactGA from 'react-ga4'
import PersonListPage from './pages/PersonListPage'
import PersonSettingsPage from './pages/PersonSettingsPage'
import AttendanceCalendarPage from './pages/AttendanceCalendarPage'
import NotesPage from './pages/NotesPage'
import SignInPage from './pages/SignInPage'
import SettingsPage from './pages/SettingsPage'
import WorkspaceSettingsPage from './pages/WorkspaceSettingsPage'
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ToastContainer } from './components/Toast';

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-SS2XTNR948'
ReactGA.initialize(GA_MEASUREMENT_ID)

function PageTracker() {
  const location = useLocation()

  useEffect(() => {
    ReactGA.send({ hitType: 'pageview', page: location.pathname + location.search })
  }, [location])

  useEffect(() => {
    const handleGlobalClick = (event) => {
      const target = event.target.closest('button, a, input, [role="button"]')
      if (target) {
        const label =
          target.innerText?.trim().slice(0, 50) ||
          target.getAttribute('aria-label') ||
          target.getAttribute('title') ||
          target.getAttribute('name') ||
          target.tagName.toLowerCase()

        ReactGA.event({
          category: 'User Action',
          action: `click_${target.tagName.toLowerCase()}`,
          label,
        })
      }
    }

    document.addEventListener('click', handleGlobalClick, true)
    return () => document.removeEventListener('click', handleGlobalClick, true)
  }, [])

  return null
}

function App() {
  const RequireAuth = ({ children }) => {
    const isAuthed = !!localStorage.getItem('auth_token')
    return isAuthed ? children : <Navigate to="/signin" replace />
  }

  return (
    <GoogleOAuthProvider clientId="719964045968-cmh03lg080igf8f4lh8ng70mhhbqtt3q.apps.googleusercontent.com">
      <HashRouter basename="">
        <PageTracker />
        <div className="app-shell">
          <main className="content">
            <Routes>
              <Route path="/signin" element={<SignInPage />} />
              <Route path="/" element={<RequireAuth><PersonListPage /></RequireAuth>} />
              <Route path="/people" element={<RequireAuth><PersonListPage /></RequireAuth>} />
              <Route path="/settings" element={<RequireAuth><SettingsPage /></RequireAuth>} />
              <Route path="/workspace/settings" element={<RequireAuth><WorkspaceSettingsPage /></RequireAuth>} />
              <Route path="/people/:personId/calendar" element={<RequireAuth><AttendanceCalendarPage /></RequireAuth>} />
              <Route path="/people/:personId/notes" element={<RequireAuth><NotesPage /></RequireAuth>} />
              <Route path="/people/:personId/settings" element={<RequireAuth><PersonSettingsPage /></RequireAuth>} />
            </Routes>
          </main>
          <ToastContainer />
        </div>
      </HashRouter>
    </GoogleOAuthProvider>
  )
}

export default App
