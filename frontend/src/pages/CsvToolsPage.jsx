import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'

const CsvToolsPage = () => {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const [selectedFile, setSelectedFile] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const openFilePicker = () => {
    setError('')
    setMessage('')
    fileInputRef.current?.click()
  }

  const handleFileSelection = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setSelectedFile(file.name)
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/students/import-csv', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Unable to import CSV file.')
      }

      setMessage(`${result.message} Total students: ${result.total_students}.`)
    } catch (importError) {
      setError(importError.message)
    } finally {
      setLoading(false)
      event.target.value = ''
    }
  }

  const handleExport = async () => {
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch('/api/students/export-csv')
      if (!response.ok) {
        throw new Error('Unable to export CSV file.')
      }

      const csvBlob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(csvBlob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = 'students.csv'
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(downloadUrl)
      setMessage('CSV export started. Check your downloads folder.')
    } catch (exportError) {
      setError(exportError.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout
      title="CSV Tools"
      subtitle="Import new student records or export the current dataset as CSV."
      headerAction={(
        <button
          onClick={() => navigate('/dashboard')}
          className="dash-btn dash-btn-ghost px-4 py-2 text-sm"
        >
          Back to Dashboard
        </button>
      )}
    >
      <div className="w-full space-y-8">
        <div className="dash-card p-6">
          <h2 className="text-xl font-bold text-[var(--dash-text)]">Import Behavior</h2>
          <p className="mt-2 text-sm text-[var(--dash-muted)]">
            Every new CSV import now replaces the previous student dataset automatically.
          </p>

          <div className="mt-6 rounded-2xl border border-[var(--dash-border)] bg-[var(--dash-surface-2)] p-5">
            <p className="text-lg font-semibold text-[var(--dash-text)]">Replace current data</p>
            <p className="mt-2 text-sm text-[var(--dash-muted)]">
              Importing a new CSV deletes the previous dataset and loads only the students from the new file.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="dash-card p-8">
            <p className="text-sm font-medium uppercase tracking-wider text-[var(--dash-accent-strong)]">Option 1</p>
            <h3 className="mt-3 text-2xl font-bold text-[var(--dash-text)]">Import CSV</h3>
            <p className="mt-3 text-[var(--dash-muted)]">
              Click below to open your file explorer and choose a CSV file to upload into the project.
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleFileSelection}
            />

            <button
              onClick={openFilePicker}
              disabled={loading}
              className="dash-btn dash-btn-primary mt-6 px-5 py-3 text-sm disabled:opacity-60"
            >
              {loading ? 'Working...' : 'Choose CSV File'}
            </button>

            <p className="mt-4 text-sm text-[var(--dash-muted)]">
              Selected file: {selectedFile || 'No file chosen yet'}
            </p>
          </div>

          <div className="dash-card p-8">
            <p className="text-sm font-medium uppercase tracking-wider text-[var(--dash-success)]">Option 2</p>
            <h3 className="mt-3 text-2xl font-bold text-[var(--dash-text)]">Export CSV</h3>
            <p className="mt-3 text-[var(--dash-muted)]">
              Download the current student dataset as a CSV file. Your browser will handle the save dialog or download location.
            </p>

            <button
              onClick={handleExport}
              disabled={loading}
              className="dash-btn dash-btn-primary mt-6 px-5 py-3 text-sm disabled:opacity-60"
            >
              {loading ? 'Working...' : 'Export Current Data'}
            </button>
          </div>
        </div>

        <div className="dash-card p-6">
          <h3 className="text-lg font-bold text-[var(--dash-text)]">Required CSV Columns</h3>
          <p className="mt-3 text-sm text-[var(--dash-muted)]">
            `name`, `class`, `section`, `attendance`, `marks`, `risk_score`, `risk_level`, `explanation`
          </p>
          <div className="mt-4 rounded-2xl border border-[var(--dash-border)] bg-[color:var(--dash-warm-soft)] p-4 text-sm leading-6 text-[var(--dash-warm)]">
            Temporary testing shortcut: you can also upload a CSV with `name` plus subject-wise attendance columns such as
            `math_attendance`, `science_attendance`, `english_attendance`. The backend will average those columns and auto-fill
            the missing fields for testing.
          </div>
          {message ? (
            <div className="mt-4 rounded-xl border border-[var(--dash-border)] bg-[var(--dash-accent-soft)] p-4 text-[var(--dash-success)]">
              {message}
            </div>
          ) : null}
          {error ? (
            <div className="mt-4 rounded-xl border border-[var(--dash-border)] bg-[color:var(--dash-warm-soft)] p-4 text-[var(--dash-danger)]">
              {error}
            </div>
          ) : null}
        </div>
      </div>
    </DashboardLayout>
  )
}

export default CsvToolsPage
