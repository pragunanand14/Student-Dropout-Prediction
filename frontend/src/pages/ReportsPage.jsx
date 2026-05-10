import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import useDashboardData from '../hooks/useDashboardData'

const ReportsPage = () => {
  const navigate = useNavigate()
  const { students, loading, error } = useDashboardData()

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen bg-[var(--dash-bg)]">Loading reports...</div>
  }

  const highRiskStudents = students.filter((student) => student.risk_level === 'High')
  const topAttendanceDrop = [...students]
    .sort((a, b) => a.attendance - b.attendance)
    .slice(0, 5)

  return (
    <DashboardLayout
      title="Reports"
      subtitle="Quick report-style summaries to review and act on."
    >
      {error ? (
        <div className="mb-6 rounded-2xl border border-[var(--dash-border)] bg-[color:var(--dash-warm-soft)] p-4 text-[var(--dash-danger)]">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="dash-card p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-[var(--dash-text)]">Priority Follow-up</h2>
            <button
              onClick={() => navigate('/students')}
              className="dash-btn dash-btn-primary px-4 py-2 text-sm"
            >
              Open Students
            </button>
          </div>
          <div className="space-y-4">
            {highRiskStudents.slice(0, 5).map((student) => (
              <div key={student.id} className="dash-panel p-4">
                <p className="font-semibold text-[var(--dash-text)]">{student.name}</p>
                <p className="text-sm text-[var(--dash-muted)]">Risk Score: {student.risk_score} | Attendance: {student.attendance}%</p>
              </div>
            ))}
            {!highRiskStudents.length ? (
              <p className="text-sm text-[var(--dash-muted)]">No high-risk students in the current dataset.</p>
            ) : null}
          </div>
        </div>

        <div className="dash-card p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-[var(--dash-text)]">Attendance Watchlist</h2>
            <button
              onClick={() => navigate('/analytics')}
              className="dash-btn dash-btn-ghost px-4 py-2 text-sm"
            >
              View Analytics
            </button>
          </div>
          <div className="space-y-4">
            {topAttendanceDrop.map((student) => (
              <div key={student.id} className="dash-panel p-4">
                <p className="font-semibold text-[var(--dash-text)]">{student.name}</p>
                <p className="text-sm text-[var(--dash-muted)]">Class {student.class}-{student.section} | Attendance: {student.attendance}% | Marks: {student.marks}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default ReportsPage
