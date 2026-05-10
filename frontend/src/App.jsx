import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Login from './components/Login'
import DashboardPage from './pages/DashboardPage'
import StudentsPage from './pages/StudentsPage'
import AnalyticsPage from './pages/AnalyticsPage'
import ReportsPage from './pages/ReportsPage'
import SettingsPage from './pages/SettingsPage'
import CsvToolsPage from './pages/CsvToolsPage'
import StudentProfilePage from './pages/StudentProfilePage'
import SupportChatbot from './pages/SupportChatbot'
import ChatReportsPage from './pages/ChatReportsPage'

const transitionDurationMs = 220

function AppRoutes() {
  const location = useLocation()
  const [displayLocation, setDisplayLocation] = useState(location)
  const [transitionStage, setTransitionStage] = useState('route-fade-in')

  useEffect(() => {
    if (location.pathname !== displayLocation.pathname) {
      setTransitionStage('route-fade-out')

      const timeoutId = window.setTimeout(() => {
        setDisplayLocation(location)
        setTransitionStage('route-fade-in')
      }, transitionDurationMs)

      return () => window.clearTimeout(timeoutId)
    }

    return undefined
  }, [location, displayLocation])

  return (
    <div className={`route-shell ${transitionStage}`}>
      <Routes location={displayLocation}>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/students" element={<StudentsPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/csv-tools" element={<CsvToolsPage />} />
        <Route path="/student/:id" element={<StudentProfilePage />} />
        <Route path="/support-chat" element={<SupportChatbot />} />
        <Route path="/chat-reports" element={<ChatReportsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

function App() {
  return (
    <Router>
      <div className="app-theme min-h-screen bg-gray-50 text-gray-900">
        <AppRoutes />
      </div>
    </Router>
  )
}

export default App
