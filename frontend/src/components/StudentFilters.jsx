const StudentFilters = ({
  filters,
  setFilters,
  totalStudents,
  filteredCount,
}) => {
  const sortOptions = [
    { value: 'name_asc', label: 'A-Z' },
    { value: 'name_desc', label: 'Z-A' },
    { value: 'marks_desc', label: 'Marks' },
    { value: 'attendance_desc', label: 'Attendance' },
    { value: 'average_marks_desc', label: '% Score' },
    { value: 'risk_score_desc', label: 'Risk score' },
  ]

  const updateFilter = (key, value) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
    }))
  }

  const selectedSortValue = `${filters.sortBy}_${filters.sortOrder}`

  const updateSort = (value) => {
    const separatorIndex = value.lastIndexOf('_')
    const sortBy = value.slice(0, separatorIndex)
    const sortOrder = value.slice(separatorIndex + 1)
    setFilters((current) => ({
      ...current,
      sortBy,
      sortOrder,
    }))
  }

  const clearFilters = () => {
    setFilters({
      rollNumber: '',
      classFilter: '',
      riskFilter: '',
      sortBy: 'risk_score',
      sortOrder: 'desc',
    })
  }

  return (
    <section className="dash-card mb-8 px-6 py-5">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-xl">
          <p className="dash-kicker">Student Directory</p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-[var(--dash-text)]">Filter active records</h2>
          <p className="dash-muted mt-2 text-sm leading-6">
            Search the roster quickly by roll number, class, or current risk band.
          </p>
        </div>

        <div className="dash-panel px-4 py-3 text-right">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">Visible</p>
          <p className="mt-1 text-lg font-semibold text-[var(--dash-text)]">{filteredCount} / {totalStudents}</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.2fr)_180px_180px_180px_auto]">
        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--dash-muted)]">Roll number</span>
          <input
            type="text"
            placeholder="Search by roll number..."
            className="w-full rounded-2xl border border-[var(--dash-border)] bg-[var(--dash-surface-2)] px-4 py-3 text-sm text-[var(--dash-text)] outline-none transition focus:border-[var(--dash-accent)] focus:bg-[var(--dash-surface)] focus:ring-4 focus:ring-[var(--dash-accent-soft)]"
            value={filters.rollNumber}
            onChange={(e) => updateFilter('rollNumber', e.target.value)}
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--dash-muted)]">Class</span>
          <select
            value={filters.classFilter}
            onChange={(e) => updateFilter('classFilter', e.target.value)}
            className="rounded-2xl border border-[var(--dash-border)] bg-[var(--dash-surface-2)] px-4 py-3 text-sm text-[var(--dash-text)] outline-none transition focus:border-[var(--dash-accent)] focus:bg-[var(--dash-surface)] focus:ring-4 focus:ring-[var(--dash-accent-soft)]"
          >
            <option value="">All Classes</option>
            <option value="10">3rd Sem</option>
          </select>
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--dash-muted)]">Risk</span>
          <select
            value={filters.riskFilter}
            onChange={(e) => updateFilter('riskFilter', e.target.value)}
            className="rounded-2xl border border-[var(--dash-border)] bg-[var(--dash-surface-2)] px-4 py-3 text-sm text-[var(--dash-text)] outline-none transition focus:border-[var(--dash-accent)] focus:bg-[var(--dash-surface)] focus:ring-4 focus:ring-[var(--dash-accent-soft)]"
          >
            <option value="">All Risk Levels</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--dash-muted)]">Sort by</span>
          <select
            value={selectedSortValue}
            onChange={(e) => updateSort(e.target.value)}
            className="rounded-2xl border border-[var(--dash-border)] bg-[var(--dash-surface-2)] px-4 py-3 text-sm text-[var(--dash-text)] outline-none transition focus:border-[var(--dash-accent)] focus:bg-[var(--dash-surface)] focus:ring-4 focus:ring-[var(--dash-accent-soft)]"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>

        <div className="flex items-end">
          <button
            onClick={clearFilters}
            className="dash-btn dash-btn-primary inline-flex w-full items-center justify-center px-4 py-3 text-sm"
          >
            Reset filters
          </button>
        </div>
      </div>
    </section>
  )
}

export default StudentFilters
