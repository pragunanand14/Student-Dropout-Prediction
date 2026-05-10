import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import StatsCards from '../components/StatsCards'
import Charts from '../components/Charts'
import AlertsPanel from '../components/AlertsPanel'
import StudentTable from '../components/StudentTable'
import useDashboardData from '../hooks/useDashboardData'
import useAlerts from '../hooks/useAlerts'
import { factorStyles, mostCommonRiskFactor } from '../utils/explainability'
import { getFilteredStudents } from '../utils/studentFilters'

const SkeletonCard = () => (
  <div className="animate-pulse rounded-[28px] bg-white/5 border border-white/10 p-7 shadow-[0_30px_90px_-40px_rgba(10,24,38,0.3)] backdrop-blur-xl">
    <div className="h-4 w-32 rounded-full bg-white/10 mb-4"></div>
    <div className="h-10 w-24 rounded-full bg-white/10 mb-6"></div>
    <div className="h-12 w-20 rounded-full bg-white/20"></div>
  </div>
)

const SkeletonExecutive = () => (
  <div className="animate-pulse rounded-[32px] border border-transparent bg-gradient-to-br from-[#10283f]/80 p-8 shadow-[0_30px_90px_-40px_rgba(10,24,38,0.5)] backdrop-blur-xl">
    <div className="h-4 w-24 rounded-full bg-white/20 mb-4"></div>
    <div className="h-8 w-64 rounded-full bg-white/20 mb-6"></div>
    <div className="h-5 w-80 rounded-full bg-white/15 mb-8"></div>
    <div className="flex gap-3">
      <div className="h-10 w-28 rounded-full bg-white/15"></div>
      <div className="h-10 w-36 rounded-full bg-white/15"></div>
    </div>
  </div>
)

const SkeletonOperational = () => (
  <div className="animate-pulse rounded-[28px] bg-white/5 border border-white/10 p-8 shadow-[0_30px_90px_-40px_rgba(10,24,38,0.3)] backdrop-blur-xl">
    <div className="h-4 w-32 rounded-full bg-white/10 mb-6"></div>
    <div className="space-y-4">
      <div className="flex justify-between">
        <div className="h-5 w-32 rounded-full bg-white/10"></div>
        <div className="h-9 w-24 rounded-full bg-white/15"></div>
      </div>
      <div className="flex justify-between">
        <div className="h-5 w-24 rounded-full bg-white/10"></div>
        <div className="h-9 w-20 rounded-full bg-white/15"></div>
      </div>
    </div>
  </div>
)

const SkeletonAlerts = () => (
  <div className="animate-pulse rounded-[28px] bg-white/5 border border-white/10 p-7 shadow-[0_30px_90px_-40px_rgba(10,24,38,0.3)] backdrop-blur-xl space-y-4">
    <div className="h-7 w-48 rounded-full bg-white/10 mb-4"></div>
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <div className="h-32 rounded-2xl bg-white/10"></div>
      <div className="h-32 rounded-2xl bg-white/10"></div>
      <div className="h-32 rounded-2xl bg-white/10"></div>
      <div className="h-32 rounded-2xl bg-white/10"></div>
    </div>
  </div>
)

const SkeletonCharts = () => (
  <div className="animate-pulse rounded-[28px] bg-white/5 border border-white/10 p-8 shadow-[0_30px_90px_-40px_rgba(10,24,38,0.3)] backdrop-blur-xl">
    <div className="h-8 w-64 rounded-full bg-white/10 mb-8"></div>
    <div className="h-96 rounded-3xl bg-gradient-to-r from-white/5 to-white/10"></div>
  </div>
)

const defaultFilters = {
  rollNumber: '',
  classFilter: '',
  riskFilter: '',
  sortBy: 'risk_score',
  sortOrder: 'desc',
}

const DashboardPage = () => {
  const navigate = useNavigate()
  const { stats, students, loading, error, refetch } = useDashboardData()
  const {
    alerts,
    summary: alertsSummary,
    loading: alertsLoading,
    error: alertsError,
    refetch: refetchAlerts,
  } = useAlerts()
  const filteredStudents = useMemo(
    () => getFilteredStudents(students, defaultFilters),
    [students],
  )
  const commonFactor = useMemo(
    () => mostCommonRiskFactor(students),
    [students],
  )
  if (loading) {
    return (
      <DashboardLayout title="Dashboard">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 xl:grid-cols-4 mb-8">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1.5fr_0.95fr]">
          <SkeletonExecutive />
          <SkeletonOperational />
        </div>
        <SkeletonAlerts />
        <SkeletonCharts />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      title="Dashboard"
      subtitle="Overview of dropout risk, class performance, and student activity."
      headerAction={(
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/csv-tools')}
            className="dash-btn dash-btn-ghost px-4 py-2.5 text-sm"
          >
            Import / Export CSV
          </button>
          <button
            onClick={() => {
              refetch()
              refetchAlerts()
            }}
            className="dash-btn dash-btn-primary px-4 py-2.5 text-sm"
          >
            Refresh
          </button>
        </div>
      )}
    >
      {error ? (
        <div className="mb-8 rounded-[28px] border border-white/10 bg-white/5 p-6 text-white/80 shadow-[0_25px_70px_-40px_rgba(15,23,42,0.35)] backdrop-blur-xl">
          {error}
        </div>
      ) : null}

      <StatsCards stats={stats} />

      <section className="mb-12 mt-12 grid grid-cols-1 gap-8 xl:grid-cols-[1.5fr_0.95fr]">
        <div className="overflow-hidden rounded-[32px] border border-transparent bg-gradient-to-br from-[#1f9d8b]/90 via-[#1c4f8a] to-[#10283f] px-8 py-8 text-white shadow-[0_40px_120px_-60px_rgba(10,24,38,0.9)] backdrop-blur-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/70">Executive Summary</p>
          <h2 className="mt-4 max-w-2xl text-3xl font-bold tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
            Most common risk factor across cohort
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/90">
            {commonFactor.count
              ? `${commonFactor.factor} affects ${commonFactor.count} students (${Math.round((commonFactor.count / (stats.total || 1)) * 100)}%) in current snapshot.`
              : 'No dominant factor detected.'
            }
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <span className={`rounded-full border border-white/15 bg-white/10 px-6 py-3 text-sm font-bold backdrop-blur-sm ${factorStyles[commonFactor.factor] || ''}`}>
              {commonFactor.factor}
            </span>
            <span className="rounded-full border border-white/15 bg-white/10 px-6 py-3 text-sm font-semibold text-white/85 backdrop-blur-sm">
              AI Analysis
            </span>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/5 p-8 shadow-[0_30px_90px_-40px_rgba(10,24,38,0.5)] backdrop-blur-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/60">Operational View</p>
          <h3 className="mt-3 text-2xl font-bold text-white">Current status</h3>
          <div className="mt-6 space-y-5">
            <div className="flex justify-between items-end">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">Students under review</p>
              <p className="text-3xl font-bold text-white">{stats.high_risk + stats.medium_risk}</p>
            </div>
            <div className="flex justify-between items-end">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">Stable records</p>
              <p className="text-3xl font-bold text-white">{stats.low_risk}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="mb-12">
        <AlertsPanel
          alerts={alerts}
          summary={alertsSummary}
          loading={alertsLoading}
          error={alertsError}
          onRefresh={refetchAlerts}
        />
      </div>

      <div className="grid grid-cols-1 gap-8">
        <Charts students={filteredStudents} />
      </div>

      <section className="mt-12">
        <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/60">Student Overview</p>
            <h3 className="mt-2 text-2xl font-bold text-white">Review the highest-priority students</h3>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-white/70">
              Open each student profile or generate a report directly from the dashboard for faster follow-up.
            </p>
          </div>
        </div>

        <StudentTable
          students={filteredStudents.slice(0, 8)}
        />
      </section>
    </DashboardLayout>
  )
}

export default DashboardPage
