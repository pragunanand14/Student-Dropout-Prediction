import { useMemo, useState } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import StudentFilters from '../components/StudentFilters'
import StudentTable from '../components/StudentTable'
import useDashboardData from '../hooks/useDashboardData'
import { getFilteredStudents } from '../utils/studentFilters'

const defaultFilters = {
  rollNumber: '',
  classFilter: '',
  riskFilter: '',
  sortBy: 'risk_score',
  sortOrder: 'desc',
}

const StudentsPage = () => {
  const { students, loading, error, refetch } = useDashboardData()
  const [filters, setFilters] = useState(defaultFilters)

  const filteredStudents = useMemo(
    () => getFilteredStudents(students, filters),
    [students, filters],
  )

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen bg-[var(--dash-bg)]">Loading students...</div>
  }

  return (
    <DashboardLayout
      title="Students"
      subtitle="Browse the student roster and inspect individual risk details."
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

      <StudentFilters
        filters={filters}
        setFilters={setFilters}
        totalStudents={students.length}
        filteredCount={filteredStudents.length}
      />

      <StudentTable
        students={filteredStudents}
      />
    </DashboardLayout>
  )
}

export default StudentsPage
