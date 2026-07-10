import { BrowserRouter, Route, Routes } from 'react-router-dom'
import PersonListPage from './pages/PersonListPage'
import PersonSettingsPage from './pages/PersonSettingsPage'
import AttendanceCalendarPage from './pages/AttendanceCalendarPage'

function App() {
  return (
    <BrowserRouter basename="/attendance_logger">
      <div className="app-shell">
        <main className="content">
          <Routes>
            <Route path="/" element={<PersonListPage />} />
            <Route path="/people" element={<PersonListPage />} />
            <Route path="/people/:personId/settings" element={<PersonSettingsPage />} />
            <Route path="/people/:personId/calendar" element={<AttendanceCalendarPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
