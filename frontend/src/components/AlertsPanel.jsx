import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const alertTypeMeta = {
  attendance: {
    label: 'Attendance',
    icon: (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M8 3v4M16 3v4M3 10h18" />
      </svg>
    ),
  },
  percentage: {
    label: '% Score',
    icon: (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 19h16" />
        <path d="M7 15l3-3 3 2 4-5" />
      </svg>
    ),
  },
  sentiment: {
    label: 'Sentiment',
    icon: (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M5 6h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-4 3v-3H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" />
      </svg>
    ),
  },
  high_risk: {
    label: 'High Risk',
    icon: (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 3 2.8 19a1.2 1.2 0 0 0 1 2h16.4a1.2 1.2 0 0 0 1-2Z" />
        <path d="M12 9v4M12 17h.01" />
      </svg>
    ),
  },
  engagement: {
    label: 'Engagement',
    icon: (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M6 18V8M12 18V5M18 18v-7" />
      </svg>
    ),
  },
}

const severityStyles = {
  high: 'bg-[color:var(--dash-warm-soft)] text-[var(--dash-danger)] ring-1 ring-[var(--dash-border)]',
  medium: 'bg-[color:var(--dash-warm-soft)] text-[var(--dash-warm)] ring-1 ring-[var(--dash-border)]',
  low: 'bg-[var(--dash-accent-soft)] text-[var(--dash-success)] ring-1 ring-[var(--dash-border)]',
}

const summaryCards = [
  { key: 'total_alerts', label: 'Total Alerts', tone: 'bg-[var(--dash-accent-strong)] text-white' },
  { key: 'high_severity', label: 'High Severity', tone: 'bg-[color:var(--dash-warm-soft)] text-[var(--dash-danger)] ring-1 ring-[var(--dash-border)]' },
  { key: 'medium_severity', label: 'Medium Severity', tone: 'bg-[color:var(--dash-warm-soft)] text-[var(--dash-warm)] ring-1 ring-[var(--dash-border)]' },
  { key: 'low_severity', label: 'Low Severity', tone: 'bg-[var(--dash-accent-soft)] text-[var(--dash-success)] ring-1 ring-[var(--dash-border)]' },
]

const AlertsPanel = ({ alerts, summary, loading, error, onRefresh }) => {
  const navigate = useNavigate()
  const [severityFilter, setSeverityFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [sortBy, setSortBy] = useState('severity')

  const filteredAlerts = useMemo(() => {
    const severityOrder = { high: 0, medium: 1, low: 2 }

    return [...alerts]
      .filter((alert) => (severityFilter ? alert.severity === severityFilter : true))
      .filter((alert) => (typeFilter ? alert.type === typeFilter : true))
      .sort((first, second) => {
        if (sortBy === 'student') return first.student_name.localeCompare(second.student_name)
        if (sortBy === 'date') return second.date.localeCompare(first.date)
        return severityOrder[first.severity] - severityOrder[second.severity]
      })
  }, [alerts, severityFilter, typeFilter, sortBy])

  return (
    <section className="dash-card px-6 py-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="dash-kicker">Intervention Queue</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--dash-text)]">Early warning alerts</h2>
          <p className="dash-muted mt-2 text-sm leading-6">
            Students who need review first based on attendance, percentage score, engagement, sentiment, and live risk rules.
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="dash-btn dash-btn-primary inline-flex items-center justify-center px-4 py-3 text-sm"
        >
          Refresh alerts
        </button>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <div key={card.key} className={`rounded-2xl px-4 py-4 ${card.tone}`}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] opacity-75">{card.label}</p>
            <p className="mt-3 text-3xl font-semibold">{summary[card.key] ?? 0}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <select
          value={severityFilter}
          onChange={(event) => setSeverityFilter(event.target.value)}
          className="rounded-2xl border border-[var(--dash-border)] bg-[var(--dash-surface-2)] px-4 py-3 text-sm text-[var(--dash-text)] outline-none transition focus:border-[var(--dash-accent)] focus:bg-[var(--dash-surface)] focus:ring-4 focus:ring-[var(--dash-accent-soft)]"
        >
          <option value="">All Severities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <select
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
          className="rounded-2xl border border-[var(--dash-border)] bg-[var(--dash-surface-2)] px-4 py-3 text-sm text-[var(--dash-text)] outline-none transition focus:border-[var(--dash-accent)] focus:bg-[var(--dash-surface)] focus:ring-4 focus:ring-[var(--dash-accent-soft)]"
        >
          <option value="">All Alert Types</option>
          {Object.keys(alertTypeMeta).map((type) => (
            <option key={type} value={type}>{alertTypeMeta[type].label}</option>
          ))}
        </select>

        <select
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value)}
          className="rounded-2xl border border-[var(--dash-border)] bg-[var(--dash-surface-2)] px-4 py-3 text-sm text-[var(--dash-text)] outline-none transition focus:border-[var(--dash-accent)] focus:bg-[var(--dash-surface)] focus:ring-4 focus:ring-[var(--dash-accent-soft)]"
        >
          <option value="severity">Sort by Severity</option>
          <option value="date">Sort by Date</option>
          <option value="student">Sort by Student</option>
        </select>
      </div>

      {loading ? (
        <div className="mt-6 rounded-2xl border border-dashed border-[var(--dash-border)] px-6 py-12 text-center text-sm text-[var(--dash-muted)]">
          Loading alerts...
        </div>
      ) : null}

      {error ? (
        <div className="mt-6 rounded-2xl border border-[var(--dash-border)] bg-[color:var(--dash-warm-soft)] px-4 py-4 text-sm text-[var(--dash-danger)]">
          {error}
        </div>
      ) : null}

      {!loading && !error && !filteredAlerts.length ? (
        <div className="mt-6 rounded-2xl border border-dashed border-[var(--dash-border)] px-6 py-12 text-center text-sm text-[var(--dash-muted)]">
          No alerts found for the current filters.
        </div>
      ) : null}

      {!loading && !error && filteredAlerts.length ? (
        <div className="mt-6 space-y-3">
          {filteredAlerts.map((alert) => (
            <button
              key={`${alert.student_id}-${alert.type}-${alert.message}`}
              onClick={() => navigate(`/student/${alert.student_id}`)}
              className="w-full rounded-[26px] border border-[var(--dash-border)] bg-[var(--dash-surface-2)] px-5 py-5 text-left transition-all hover:bg-[var(--dash-surface)] hover:shadow-lg"
            >
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="flex items-start gap-4">
                  <div className={`mt-0.5 flex h-11 w-11 items-center justify-center rounded-2xl ${severityStyles[alert.severity]}`}>
                    {alertTypeMeta[alert.type]?.icon}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-[var(--dash-text)]">{alert.student_name}</h3>
                      <span className="rounded-full bg-[var(--dash-surface)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--dash-muted)] ring-1 ring-[var(--dash-border)]">
                        {alertTypeMeta[alert.type]?.label ?? alert.type}
                      </span>
                      <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${severityStyles[alert.severity]}`}>
                        {alert.severity}
                      </span>
                    </div>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--dash-muted)]">{alert.message}</p>
                  </div>
                </div>
                <div className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--dash-muted)]">
                  {alert.date}
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : null}
    </section>
  )
}

export default AlertsPanel

