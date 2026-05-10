import DashboardLayout from '../components/DashboardLayout'
import Charts from '../components/Charts'
import StatsCards from '../components/StatsCards'
import useDashboardData from '../hooks/useDashboardData'
import { buildAnalyticsInsights } from '../utils/analytics'

const AnalyticsPage = () => {
  const { stats, students, loading, error, refetch } = useDashboardData()

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen bg-[var(--dash-bg)]">Loading analytics...</div>
  }

  const highRiskStudents = students.filter((student) => student.risk_level === 'High').length
  const averageAttendance = students.length
    ? Math.round(students.reduce((sum, student) => sum + student.attendance, 0) / students.length)
    : 0
  const averagePercentage = students.length
    ? Math.round(students.reduce((sum, student) => sum + (student.percentage_score ?? student.average_marks ?? student.marks ?? 0), 0) / students.length)
    : 0
  const insights = buildAnalyticsInsights(students)
  const classSectionBreakdown = students.reduce((accumulator, student) => {
    const key = `${student.class}${student.section}`
    if (!accumulator[key]) {
      accumulator[key] = {
        label: `Class ${student.class}${student.section}`,
        total: 0,
        mediumRisk: 0,
      }
    }

    accumulator[key].total += 1
    if (student.risk_level === 'Medium') {
      accumulator[key].mediumRisk += 1
    }

    return accumulator
  }, {})
  const classSectionCards = Object.values(classSectionBreakdown)
    .sort((first, second) => (second.mediumRisk / second.total) - (first.mediumRisk / first.total))
    .slice(0, 3)

  return (
    <DashboardLayout
      title="Analytics"
      subtitle="Trend views and summary signals from the current student dataset."
      headerAction={(
        <button
          onClick={refetch}
          className="dash-btn dash-btn-primary px-4 py-2 text-sm"
        >
          Refresh
        </button>
      )}
    >
      {error ? (
        <div className="mb-6 rounded-2xl border border-[var(--dash-border)] bg-[color:var(--dash-warm-soft)] p-4 text-[var(--dash-danger)]">
          {error}
        </div>
      ) : null}

      <StatsCards stats={stats} />

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="dash-card p-6">
          <p className="text-sm font-medium uppercase tracking-wider text-[var(--dash-muted)]">High Risk Students</p>
          <p className="mt-4 text-4xl font-bold text-[var(--dash-danger)]">{highRiskStudents}</p>
        </div>
        <div className="dash-card p-6">
          <p className="text-sm font-medium uppercase tracking-wider text-[var(--dash-muted)]">Average Attendance</p>
          <p className="mt-4 text-4xl font-bold text-[var(--dash-accent-strong)]">{averageAttendance}%</p>
        </div>
        <div className="dash-card p-6">
          <p className="text-sm font-medium uppercase tracking-wider text-[var(--dash-muted)]">Average % Score</p>
          <p className="mt-4 text-4xl font-bold text-[var(--dash-success)]">{averagePercentage}%</p>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {insights.map((insight) => (
          <div key={insight.title} className="dash-card p-6">
            <p className="text-sm font-medium uppercase tracking-wider text-[var(--dash-muted)]">{insight.title}</p>
            <p className="mt-4 text-base leading-7 text-[var(--dash-muted)]">{insight.description}</p>
          </div>
        ))}
      </div>

      <div className="dash-card mb-8 p-6">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-xl font-bold text-[var(--dash-text)]">Class / Section Risk Hotspots</h3>
          <p className="text-sm text-[var(--dash-muted)]">Highest medium-risk concentration</p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {classSectionCards.map((item) => (
            <div key={item.label} className="dash-panel p-5">
              <p className="text-sm font-medium uppercase tracking-wider text-[var(--dash-muted)]">{item.label}</p>
              <p className="mt-3 text-3xl font-bold text-[var(--dash-warm)]">{Math.round((item.mediumRisk / item.total) * 100)}%</p>
              <p className="mt-2 text-sm text-[var(--dash-muted)]">{item.mediumRisk} medium-risk students out of {item.total}</p>
            </div>
          ))}
        </div>
      </div>

      <Charts students={students} />
    </DashboardLayout>
  )
}

export default AnalyticsPage
