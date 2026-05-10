import { useEffect, useMemo, useState } from 'react'
import DashboardLayout from '../components/DashboardLayout'

const urgencyStyles = {
  urgent: 'bg-[color:var(--dash-warm-soft)] text-[var(--dash-danger)]',
  high: 'bg-[color:var(--dash-warm-soft)] text-[var(--dash-warm)]',
  medium: 'bg-[color:var(--dash-warm-soft)] text-[var(--dash-warm)]',
  low: 'bg-[var(--dash-accent-soft)] text-[var(--dash-success)]',
}

const ChatReportsPage = () => {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadReports = async () => {
      setLoading(true)
      setError('')

      try {
        const response = await fetch('/api/support-reports')
        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.error || 'Failed to load chat reports.')
        }
        setReports(Array.isArray(data) ? data : [])
      } catch (currentError) {
        setError(currentError.message || 'Failed to load chat reports.')
      } finally {
        setLoading(false)
      }
    }

    loadReports()
  }, [])

  const summary = useMemo(() => ({
    total: reports.length,
    shared: reports.filter((report) => report.sharing_consent).length,
    needsConsultant: reports.filter((report) => report.feedback?.needs_human_consultant).length,
    highPriority: reports.filter((report) => ['high', 'urgent'].includes(report.report?.urgency_level)).length,
  }), [reports])

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-[var(--dash-bg)]">Loading chat reports...</div>
  }

  return (
    <DashboardLayout
      title="Chat Reports"
      subtitle="Faculty-facing summaries from student support chat sessions that were shared with permission."
    >
      {error ? (
        <div className="mb-6 rounded-xl border border-[var(--dash-border)] bg-[color:var(--dash-warm-soft)] p-4 text-[var(--dash-danger)]">
          {error}
        </div>
      ) : null}

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="dash-card p-5">
          <p className="text-sm font-medium uppercase tracking-wider text-[var(--dash-muted)]">Total Shared Sessions</p>
          <p className="mt-3 text-3xl font-bold text-[var(--dash-text)]">{summary.total}</p>
        </div>
        <div className="dash-card p-5">
          <p className="text-sm font-medium uppercase tracking-wider text-[var(--dash-muted)]">Faculty-Visible</p>
          <p className="mt-3 text-3xl font-bold text-[var(--dash-text)]">{summary.shared}</p>
        </div>
        <div className="dash-card p-5">
          <p className="text-sm font-medium uppercase tracking-wider text-[var(--dash-muted)]">Needs Human Consultant</p>
          <p className="mt-3 text-3xl font-bold text-[var(--dash-text)]">{summary.needsConsultant}</p>
        </div>
        <div className="dash-card p-5">
          <p className="text-sm font-medium uppercase tracking-wider text-[var(--dash-muted)]">High Priority Follow-up</p>
          <p className="mt-3 text-3xl font-bold text-[var(--dash-text)]">{summary.highPriority}</p>
        </div>
      </div>

      <div className="space-y-6">
        {reports.length ? (
          reports
            .slice()
            .reverse()
            .map((entry) => (
              <div key={entry.id} className="dash-card p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-xl font-bold text-[var(--dash-text)]">{entry.student_name}</h2>
                      <span className="rounded-full bg-[var(--dash-surface-2)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--dash-muted)]">
                        {entry.report?.conversation_type || 'Student support chat'}
                      </span>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${urgencyStyles[entry.report?.urgency_level] || urgencyStyles.medium}`}>
                        {entry.report?.urgency_level || 'medium'} urgency
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-[var(--dash-muted)]">
                      Shared on {new Date(entry.created_at).toLocaleString()} {(entry.student_profile?.student_lookup_id || entry.student_id) ? `| Student ID ${entry.student_profile?.student_lookup_id || entry.student_id}` : ''}
                    </p>
                  </div>
                  <div className="dash-panel px-4 py-3 text-sm text-[var(--dash-text)]">
                    Ended by: <span className="font-semibold">{entry.session_end_reason || 'ended'}</span>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
                  <div className="space-y-4">
                    <div className="dash-panel p-4">
                      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--dash-success)]">Primary concern</p>
                      <p className="mt-2 text-sm leading-7 text-[var(--dash-muted)]">{entry.report?.primary_concern}</p>
                    </div>
                    <div className="dash-panel p-4">
                      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--dash-muted)]">Summary</p>
                      <p className="mt-2 text-sm leading-7 text-[var(--dash-muted)]">{entry.report?.summary}</p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-2xl border border-[var(--dash-border)] bg-[var(--dash-surface)] p-4">
                        <p className="text-sm font-semibold text-[var(--dash-text)]">Confirmed factors</p>
                        <div className="mt-3 space-y-2">
                          {(entry.report?.confirmed_risk_factors || []).map((factor) => (
                            <div key={factor} className="rounded-xl bg-[var(--dash-surface-2)] px-3 py-2 text-sm text-[var(--dash-muted)]">{factor}</div>
                          ))}
                        </div>
                      </div>
                      <div className="rounded-2xl border border-[var(--dash-border)] bg-[var(--dash-surface)] p-4">
                        <p className="text-sm font-semibold text-[var(--dash-text)]">Newly disclosed factors</p>
                        <div className="mt-3 space-y-2">
                          {(entry.report?.newly_disclosed_factors || []).map((factor) => (
                            <div key={factor} className="rounded-xl bg-[var(--dash-surface-2)] px-3 py-2 text-sm text-[var(--dash-muted)]">{factor}</div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-2xl border border-[var(--dash-border)] bg-[color:var(--dash-warm-soft)] p-4">
                      <p className="text-sm font-semibold text-[var(--dash-warm)]">Student feedback</p>
                      <div className="mt-3 space-y-2 text-sm leading-6 text-[var(--dash-muted)]">
                        <p><span className="font-semibold">Satisfaction:</span> {entry.feedback?.satisfaction || 'not_provided'}</p>
                        <p><span className="font-semibold">Needs actual consultant:</span> {entry.feedback?.needs_human_consultant ? 'Yes' : 'No'}</p>
                        <p><span className="font-semibold">Student note:</span> {entry.feedback?.note || 'No note provided.'}</p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-[var(--dash-border)] bg-[var(--dash-surface-2)] p-4">
                      <p className="text-sm font-semibold text-[var(--dash-text)]">Recommended support actions</p>
                      <div className="mt-3 space-y-2">
                        {(entry.report?.recommended_support_actions || []).map((action) => (
                          <div key={action} className="rounded-xl bg-[var(--dash-surface)] px-3 py-2 text-sm text-[var(--dash-muted)]">{action}</div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-[var(--dash-border)] bg-[var(--dash-surface-2)] p-4">
                      <p className="text-sm font-semibold text-[var(--dash-text)]">Follow-up focus</p>
                      <p className="mt-2 text-sm leading-6 text-[var(--dash-muted)]">{entry.report?.follow_up_focus}</p>
                      <p className="mt-3 text-sm leading-6 text-[var(--dash-muted)]">
                        <span className="font-semibold">Handoff note:</span> {entry.report?.counselor_handoff_note}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))
        ) : (
          <div className="dash-card p-10 text-center text-[var(--dash-muted)]">
            No shared student chat reports yet. Reports will appear here after students finish consented support chat sessions.
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default ChatReportsPage
