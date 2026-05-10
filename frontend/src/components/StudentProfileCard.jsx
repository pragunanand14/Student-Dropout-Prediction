import { factorStyles } from '../utils/explainability'

const normalizeSubjectMarks = (student) => {
  const rawSubjectMarks = student.subject_marks

  if (Array.isArray(rawSubjectMarks)) {
    return rawSubjectMarks
      .map((entry, index) => ({
        subject: entry?.subject || entry?.name || `Subject ${index + 1}`,
        marks: entry?.marks ?? entry?.score ?? '-',
      }))
      .slice(0, 5)
  }

  if (rawSubjectMarks && typeof rawSubjectMarks === 'object') {
    return Object.entries(rawSubjectMarks)
      .slice(0, 5)
      .map(([subject, marks]) => ({ subject, marks }))
  }

  return Array.from({ length: 5 }, (_, index) => ({
    subject: `Subject ${index + 1}`,
    marks: 'Pending',
  }))
}

const StudentProfileCard = ({ student, variant = 'full' }) => {
  const subjectMarks = normalizeSubjectMarks(student)
  const percentageScore = student.percentage_score ?? student.average_marks ?? student.marks ?? 0
  const resultStatus = student.result_status || (Number(percentageScore) > 33 ? 'Pass' : 'Fail')
  const riskColor = student.risk_level === 'High'
    ? 'from-[#b84545] to-[#e06f6f]'
    : student.risk_level === 'Medium'
      ? 'from-[#d17b45] to-[#f0a46f]'
      : 'from-[#2f8f83] to-[#4cc9bd]'

  const riskBadge = student.risk_level === 'High'
    ? '!'
    : student.risk_level === 'Medium'
      ? '~'
      : 'OK'

  if (variant === 'demographics') {
    return (
      <div className="max-w-4xl w-full rounded-3xl border border-[var(--dash-border)] bg-[var(--dash-surface)] shadow-2xl overflow-hidden">
        <div className="p-8 border-b border-[var(--dash-border)] bg-[linear-gradient(120deg,var(--dash-surface-2),var(--dash-surface))]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-3xl font-bold text-[var(--dash-text)]">{student.name}</h3>
              <p className="mt-1 text-xl text-[var(--dash-muted)]">3rd Sem {student.section}</p>
            </div>
            <span className="rounded-full border border-[var(--dash-border)] bg-[var(--dash-surface)] px-4 py-2 text-sm font-semibold text-[var(--dash-muted)]">
              Student ID: {student.student_lookup_id || student.id}
            </span>
          </div>
        </div>

        <div className="p-8 space-y-6">
          <div className="rounded-2xl border border-[var(--dash-border)] bg-[var(--dash-surface)] p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="text-xl font-bold text-[var(--dash-text)]">Demographic Profile</h4>
                <p className="text-sm text-[var(--dash-muted)]">Social, support, and enrollment-related details.</p>
              </div>
              <span className="rounded-full bg-[var(--dash-accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--dash-accent)]">
                Profile data
              </span>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              <div className="dash-panel p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--dash-muted)]">Gender</p>
                <p className="mt-2 text-lg font-semibold text-[var(--dash-text)]">{student.gender || 'Not available'}</p>
              </div>
              <div className="dash-panel p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--dash-muted)]">Address</p>
                <p className="mt-2 text-lg font-semibold text-[var(--dash-text)]">{student.address || student.location || 'Not available'}</p>
              </div>
              <div className="dash-panel p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--dash-muted)]">Internet Access</p>
                <p className="mt-2 text-lg font-semibold text-[var(--dash-text)]">{student.internet_access || 'Not available'}</p>
              </div>
              <div className="dash-panel p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--dash-muted)]">Scholarship</p>
                <p className="mt-2 text-lg font-semibold text-[var(--dash-text)]">{student.scholarship || 'Not available'}</p>
              </div>
              <div className="dash-panel p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--dash-muted)]">Part-Time Job</p>
                <p className="mt-2 text-lg font-semibold text-[var(--dash-text)]">{student.part_time_job || 'Not available'}</p>
              </div>
              <div className="dash-panel p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--dash-muted)]">Displaced</p>
                <p className="mt-2 text-lg font-semibold text-[var(--dash-text)]">{student.displaced || 'Not available'}</p>
              </div>
              <div className="dash-panel p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--dash-muted)]">Debtor</p>
                <p className="mt-2 text-lg font-semibold text-[var(--dash-text)]">{student.debtor || 'Not available'}</p>
              </div>
              <div className="dash-panel p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--dash-muted)]">Tuition Fees Up to Date</p>
                <p className="mt-2 text-lg font-semibold text-[var(--dash-text)]">{student.tuition_fees_up_to_date || 'Not available'}</p>
              </div>
              <div className="dash-panel p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--dash-muted)]">School Support</p>
                <p className="mt-2 text-lg font-semibold text-[var(--dash-text)]">{student.school_support || 'Not available'}</p>
              </div>
              <div className="dash-panel p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--dash-muted)]">Family Support</p>
                <p className="mt-2 text-lg font-semibold text-[var(--dash-text)]">{student.family_support || 'Not available'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl w-full rounded-3xl border border-[var(--dash-border)] bg-[var(--dash-surface)] shadow-2xl overflow-hidden">
      <div className="p-8 border-b border-[var(--dash-border)] bg-[linear-gradient(120deg,var(--dash-surface-2),var(--dash-surface))]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-3xl font-bold text-[var(--dash-text)]">{student.name}</h3>
            <p className="mt-1 text-xl text-[var(--dash-muted)]">3rd Sem {student.section}</p>
          </div>
          <span className="rounded-full border border-[var(--dash-border)] bg-[var(--dash-surface)] px-4 py-2 text-sm font-semibold text-[var(--dash-muted)]">
            Student ID: {student.student_lookup_id || student.id}
          </span>
        </div>
      </div>

      <div className="p-8 space-y-8">
        <div className={`bg-gradient-to-br ${riskColor} rounded-2xl p-8 text-white shadow-2xl`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-6xl font-black opacity-90">{student.risk_score}</p>
              <p className="text-lg font-medium opacity-90">/100</p>
            </div>
            <span className="text-4xl">{riskBadge}</span>
          </div>
          <p className="mt-6 text-xl opacity-90">{student.risk_level} Risk</p>
          <p className="mt-4 text-lg leading-relaxed opacity-80">"{student.explanation}"</p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          <div className="dash-panel p-6">
            <p className="mb-2 text-sm font-medium uppercase tracking-wide text-[var(--dash-muted)]">Attendance</p>
            <p className="text-3xl font-bold text-[var(--dash-text)]">{student.attendance}%</p>
          </div>

          <div className="dash-panel p-6">
            <p className="mb-2 text-sm font-medium uppercase tracking-wide text-[var(--dash-muted)]">Grade</p>
            <p className="text-3xl font-bold text-[var(--dash-text)]">{student.grade_letter || '-'}</p>
            <p className="mt-2 text-sm text-[var(--dash-muted)]">
              Based on the average of the 5 subject marks.
            </p>
            <p className="mt-1 text-sm text-[var(--dash-muted)]">{student.grade_description || 'No grade available'}</p>
          </div>

          <div className="dash-panel p-6">
            <p className="mb-2 text-sm font-medium uppercase tracking-wide text-[var(--dash-muted)]">% Score</p>
            <p className="text-3xl font-bold text-[var(--dash-text)]">{percentageScore}%</p>
            <p className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
              resultStatus === 'Pass'
                ? 'bg-[var(--dash-accent-soft)] text-[var(--dash-success)]'
                : 'bg-[color:var(--dash-warm-soft)] text-[var(--dash-danger)]'
            }`}>
              {resultStatus}
            </p>
          </div>

          <div className="dash-panel p-6">
            <p className="mb-2 text-sm font-medium uppercase tracking-wide text-[var(--dash-muted)]">Sentiment</p>
            <p className="text-2xl font-bold text-[var(--dash-text)]">{student.nlp_sentiment}</p>
          </div>

          <div className="dash-panel p-6">
            <p className="mb-2 text-sm font-medium uppercase tracking-wide text-[var(--dash-muted)]">Weekly Engagement</p>
            <p className="text-3xl font-bold text-[var(--dash-text)]">{student.average_engagement_weekly}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--dash-border)] bg-[var(--dash-surface)] p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h4 className="text-xl font-bold text-[var(--dash-text)]">Subject Marks</h4>
              <p className="text-sm text-[var(--dash-muted)]">Detailed marks view for up to 5 subjects.</p>
            </div>
            <span className="rounded-full bg-[var(--dash-accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--dash-accent)]">
              5 subjects
            </span>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
            {subjectMarks.map((entry) => (
              <div
                key={entry.subject}
                className="dash-panel p-4"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--dash-muted)]">
                  {entry.subject}
                </p>
                <p className="mt-3 text-2xl font-bold text-[var(--dash-text)]">{entry.marks}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--dash-border)] bg-[var(--dash-surface)] p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[color:var(--dash-warm-soft)] text-[var(--dash-danger)]">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 3 2.8 19a1.2 1.2 0 0 0 1 2h16.4a1.2 1.2 0 0 0 1-2Z" />
                <path d="M12 9v4M12 17h.01" />
              </svg>
            </span>
            <div>
              <h4 className="text-xl font-bold text-[var(--dash-text)]">Why is this student at risk?</h4>
              <p className="text-sm text-[var(--dash-muted)]">Human-readable reasons behind the current dropout risk classification.</p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {(student.top_factors || []).map((factor) => (
              <span
                key={factor}
                className={`rounded-full border px-3 py-1 text-sm font-semibold ${factorStyles[factor] || factorStyles.Stability}`}
              >
                {factor}
              </span>
            ))}
          </div>

          <div className="mt-6 space-y-3">
            {(student.risk_reasons || []).map((reason) => (
              <div key={reason} className="flex items-start gap-3 rounded-2xl border border-[var(--dash-border)] bg-[var(--dash-surface-2)] p-4">
                <span className="mt-1 flex h-7 w-7 items-center justify-center rounded-full bg-[color:var(--dash-warm-soft)] text-[var(--dash-danger)]">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 7v6M12 17h.01" />
                  </svg>
                </span>
                <p className="text-sm leading-6 text-[var(--dash-muted)]">{reason}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default StudentProfileCard
