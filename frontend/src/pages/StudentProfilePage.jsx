import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import StudentProfileCard from '../components/StudentProfileCard'

const StudentProfilePage = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchStudent = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/student/${id}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load student profile')
        }

        setStudent(data)
      } catch (fetchError) {
        setError(fetchError.message)
      } finally {
        setLoading(false)
      }
    }

    fetchStudent()
  }, [id])

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen bg-[var(--dash-bg)]">Loading student profile...</div>
  }

  return (
    <DashboardLayout
      title="Student Profile"
      subtitle="Detailed view for a single student record and risk signals."
      headerAction={(
        <button
          onClick={() => navigate('/students')}
          className="dash-btn dash-btn-ghost px-4 py-2 text-sm"
        >
          Back to Students
        </button>
      )}
    >
      {error ? (
        <div className="mb-6 rounded-2xl border border-[var(--dash-border)] bg-[color:var(--dash-warm-soft)] p-4 text-[var(--dash-danger)]">
          {error}
        </div>
      ) : null}

      {!student ? (
        <div className="rounded-2xl border border-dashed border-[var(--dash-border)] bg-[var(--dash-surface)] p-10 text-center text-[var(--dash-muted)]">
          Student not found.
        </div>
      ) : (
        <StudentProfileCard student={student} />
      )}
    </DashboardLayout>
  )
}

export default StudentProfilePage
