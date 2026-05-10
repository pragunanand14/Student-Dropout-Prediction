import { useState } from 'react'
import StudentDetail from './StudentDetail'

const modelLabels = {
  mlp: 'Meta',
}

const riskStyles = {
  High: 'bg-[color:var(--dash-warm-soft)] text-[var(--dash-danger)] ring-1 ring-[var(--dash-border)]',
  Medium: 'bg-[color:var(--dash-warm-soft)] text-[var(--dash-warm)] ring-1 ring-[var(--dash-border)]',
  Low: 'bg-[var(--dash-accent-soft)] text-[var(--dash-success)] ring-1 ring-[var(--dash-border)]',
}

const formatSerialRollNumber = (student) => String(student?.id ?? '').padStart(3, '0')

const getRiskLevelFromScore = (score) => {
  const numericScore = Number(score || 0)
  if (numericScore >= 75) return 'High'
  if (numericScore >= 45) return 'Medium'
  return 'Low'
}

const StudentTable = ({
  students,
}) => {
  const [selectedView, setSelectedView] = useState(null)
  const [predictingByStudent, setPredictingByStudent] = useState({})
  const [predictionByStudent, setPredictionByStudent] = useState({})

  const runModelPrediction = async (studentId, modelName) => {
    if (!studentId) return

    const requestKey = `${studentId}:${modelName}`
    setPredictingByStudent((current) => ({ ...current, [requestKey]: true }))

    try {
      const response = await fetch('/api/model-predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelName,
          student_id: studentId,
        }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Prediction failed.')
      }

      setPredictionByStudent((current) => ({
        ...current,
        [studentId]: {
          model: modelName,
          modelRiskScore: data.model_risk_score,
          modelRiskLevel: getRiskLevelFromScore(data.model_risk_score),
          hardcodedRiskScore: data.hardcoded_risk_score,
          hardcodedRiskLevel: data.predicted_risk_level,
          dropoutProbability: data.dropout_probability,
          updatedAt: new Date().toLocaleTimeString(),
        },
      }))
    } catch (error) {
      setPredictionByStudent((current) => ({
        ...current,
        [studentId]: {
          model: modelName,
          error: error.message || 'Prediction failed.',
          updatedAt: new Date().toLocaleTimeString(),
        },
      }))
    } finally {
      setPredictingByStudent((current) => {
        const next = { ...current }
        delete next[requestKey]
        return next
      })
    }
  }

  return (
    <>
      <section className="dash-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-[var(--dash-border)] px-6 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="dash-kicker">Student Roster</p>
            <h3 className="mt-2 text-xl font-semibold tracking-tight text-[var(--dash-text)]">Current student list</h3>
          </div>
          <div className="dash-panel px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--dash-muted)]">Rows</p>
            <p className="mt-1 text-base font-semibold text-[var(--dash-text)]">{students.length}</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-[var(--dash-surface-2)]">
              <tr>
                <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--dash-muted)]">Student</th>
                <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--dash-muted)]">Roll no.</th>
                <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--dash-muted)]">Class</th>
                <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--dash-muted)]">Attendance</th>
                <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--dash-muted)]">Grade</th>
                <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--dash-muted)]">Risk</th>
                <th className="px-6 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--dash-muted)]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--dash-border)]">
              {students.map((student) => (
                <tr key={student.id} className="transition-colors hover:bg-[var(--dash-surface-2)]">
                  <td className="px-6 py-5">
                    <p className="text-sm font-semibold text-[var(--dash-text)]">{student.name}</p>
                    <p className="mt-1 text-xs text-[var(--dash-muted)]">
                      Main factor: {student.top_factors?.[0] || 'Stable profile'}
                    </p>
                  </td>
                  <td className="px-6 py-5 text-sm text-[var(--dash-muted)]">{formatSerialRollNumber(student)}</td>
                  <td className="px-6 py-5 text-sm text-[var(--dash-muted)]">
                    3rd Sem <span className="text-[var(--dash-muted)]/70">/ {student.section}</span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex min-w-[150px] items-center gap-3">
                      <div className="h-2.5 w-full rounded-full bg-[var(--dash-border)]/70">
                        <div
                          className="h-2.5 rounded-full"
                          style={{
                            width: `${student.attendance}%`,
                            background: student.attendance > 80 ? 'var(--dash-success)' : student.attendance > 60 ? 'var(--dash-warm)' : 'var(--dash-danger)',
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium text-[var(--dash-muted)]">{student.attendance}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-[var(--dash-text)]">{student.grade_letter || '-'}</span>
                      <span className="text-xs text-[var(--dash-muted)]">{student.grade_description || 'No grade available'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${riskStyles[student.risk_level] || riskStyles.Low}`}>
                      {student.risk_level}
                    </span>
                    {predictionByStudent[student.id] ? (
                      <div className="mt-2 rounded-xl border border-[var(--dash-border)] bg-[var(--dash-surface-2)] px-3 py-2 text-xs">
                        {predictionByStudent[student.id].error ? (
                          <p className="text-[var(--dash-danger)]">
                            {modelLabels[predictionByStudent[student.id].model] || predictionByStudent[student.id].model?.toUpperCase()} error: {predictionByStudent[student.id].error}
                          </p>
                        ) : (
                          <>
                            <p className="font-semibold text-[var(--dash-text)]">
                              {modelLabels[predictionByStudent[student.id].model] || predictionByStudent[student.id].model?.toUpperCase()} model risk: {predictionByStudent[student.id].modelRiskLevel} ({predictionByStudent[student.id].modelRiskScore})
                            </p>
                            <p className="mt-1 text-[var(--dash-muted)]">
                              Dropout probability: {(Number(predictionByStudent[student.id].dropoutProbability || 0) * 100).toFixed(2)}%
                            </p>
                            <p className="mt-1 text-[var(--dash-muted)]">
                              Hardcoded risk in use: {predictionByStudent[student.id].hardcodedRiskLevel} ({predictionByStudent[student.id].hardcodedRiskScore})
                            </p>
                          </>
                        )}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => runModelPrediction(student.id, 'mlp')}
                        disabled={Boolean(predictingByStudent[`${student.id}:mlp`])}
                        className="dash-btn dash-btn-ghost inline-flex items-center px-3 py-2 text-xs"
                      >
                        {predictingByStudent[`${student.id}:mlp`] ? 'Running Meta...' : 'Run Meta'}
                      </button>
                      <button
                        onClick={() => setSelectedView({ student, variant: 'demographics' })}
                        className="dash-btn dash-btn-ghost inline-flex items-center px-4 py-2 text-sm"
                      >
                        Open profile
                      </button>
                      <button
                        onClick={() => setSelectedView({ student, variant: 'full' })}
                        className="dash-btn dash-btn-primary inline-flex items-center px-4 py-2 text-sm"
                      >
                        Report
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {selectedView ? (
        <StudentDetail
          student={selectedView.student}
          variant={selectedView.variant}
          isOpen
          onClose={() => setSelectedView(null)}
        />
      ) : null}
    </>
  )
}

export default StudentTable
