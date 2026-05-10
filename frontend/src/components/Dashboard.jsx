import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import StatsCards from './StatsCards'
import StudentTable from './StudentTable'
import Charts from './Charts'

const Dashboard = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState({})
  const [students, setStudents] = useState([])
  const [filteredStudents, setFilteredStudents] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [sectionFilter, setSectionFilter] = useState('')
  const [riskFilter, setRiskFilter] = useState('')
  const [sortBy, setSortBy] = useState('risk_score')
  const [sortOrder, setSortOrder] = useState('desc')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchStats()
    fetchStudents()
  }, [])

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/dashboard-stats')
      const data = await res.json()
      setStats(data)
    } catch (err) {
      setError('Failed to load stats')
    }
  }

  const fetchStudents = async () => {
    try {
      const res = await fetch('/api/students')
      const data = await res.json()
      setStudents(data)
      setFilteredStudents(data)
      setLoading(false)
    } catch (err) {
      setError('Failed to load students')
      setLoading(false)
    }
  }

  // Filter and sort logic
  useEffect(() => {
    let filtered = [...students]

    // Search
    if (searchTerm) {
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filters
    if (classFilter) {
      filtered = filtered.filter(s => s.class == classFilter)
    }
    if (sectionFilter) {
      filtered = filtered.filter(s => s.section === sectionFilter)
    }
    if (riskFilter) {
      filtered = filtered.filter(s => s.risk_level === riskFilter)
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal = a[sortBy]
      let bVal = b[sortBy]
      if (sortBy === 'name') {
        aVal = a.name.toLowerCase()
        bVal = b.name.toLowerCase()
      }
      if (sortOrder === 'desc') {
        return bVal > aVal ? 1 : -1
      } else {
        return aVal > bVal ? 1 : -1
      }
    })

    setFilteredStudents(filtered)
  }, [searchTerm, classFilter, sectionFilter, riskFilter, sortBy, sortOrder, students])

  const handleLogout = () => {
    navigate('/')
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen bg-[var(--dash-bg)]">Loading dashboard...</div>

  return (
    <div className="dashboard-theme flex h-screen overflow-hidden bg-[var(--dash-bg)] text-[var(--dash-text)]">
      <Sidebar onLogout={handleLogout} />
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-64">
        {/* Header */}
        <header className="border-b border-[var(--dash-border)] bg-[var(--dash-surface)] px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h1 className="dash-title text-2xl">Dashboard</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-[var(--dash-muted)]">Welcome back!</span>
            <button
              onClick={handleLogout}
              className="dash-btn dash-btn-ghost px-4 py-2 text-sm"
            >
              Logout
            </button>
          </div>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[var(--dash-bg)] p-6">
          {error && (
            <div className="mb-6 rounded-xl border border-[var(--dash-border)] bg-[color:var(--dash-warm-soft)] p-4 text-[var(--dash-danger)]">
              {error} - Make sure backend is running on localhost:5000
            </div>
          )}
          
          <StatsCards stats={stats} />
          
          {/* Table Controls */}
          <div className="dash-card mb-8 p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
              <div className="flex-1 min-w-0">
                <label className="mb-2 block text-sm font-medium text-[var(--dash-muted)]">Search students</label>
                <input
                  type="text"
                  placeholder="Search by name..."
                  className="w-full rounded-xl border border-[var(--dash-border)] bg-[var(--dash-surface-2)] px-4 py-3 text-[var(--dash-text)] focus:border-[var(--dash-accent)] focus:ring-2 focus:ring-[var(--dash-accent-soft)] transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-3 flex-wrap">
                <select
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                  className="rounded-xl border border-[var(--dash-border)] bg-[var(--dash-surface-2)] px-4 py-3 text-[var(--dash-text)] focus:border-[var(--dash-accent)] focus:ring-2 focus:ring-[var(--dash-accent-soft)]"
                >
                  <option value="">All Classes</option>
                  {[6,7,8,9,10,11,12].map(c => (
                    <option key={c} value={c}>Class {c}</option>
                  ))}
                </select>
                <select
                  value={sectionFilter}
                  onChange={(e) => setSectionFilter(e.target.value)}
                  className="rounded-xl border border-[var(--dash-border)] bg-[var(--dash-surface-2)] px-4 py-3 text-[var(--dash-text)] focus:border-[var(--dash-accent)] focus:ring-2 focus:ring-[var(--dash-accent-soft)]"
                >
                  <option value="">All Sections</option>
                  {['A','B','C','D'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <select
                  value={riskFilter}
                  onChange={(e) => setRiskFilter(e.target.value)}
                  className="rounded-xl border border-[var(--dash-border)] bg-[var(--dash-surface-2)] px-4 py-3 text-[var(--dash-text)] focus:border-[var(--dash-accent)] focus:ring-2 focus:ring-[var(--dash-accent-soft)]"
                >
                  <option value="">All Risk Levels</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
                <button className="dash-btn dash-btn-primary px-6 py-3 text-sm">
                  Clear Filters
                </button>
              </div>
            </div>
            <div className="mt-4 text-sm text-[var(--dash-muted)]">
              Showing {filteredStudents.length} of {students.length} students
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Charts students={filteredStudents} />
            <StudentTable students={filteredStudents} />
          </div>
        </main>
      </div>
    </div>
  )
}

export default Dashboard

