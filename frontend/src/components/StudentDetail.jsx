import { useEffect } from 'react'
import StudentProfileCard from './StudentProfileCard'

const StudentDetail = ({ student, variant = 'full', isOpen, onClose }) => {
  useEffect(() => {
    if (!isOpen) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !student) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="flex min-h-full items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
        <div className="relative flex max-h-[90vh] flex-col items-center">
          <button
            onClick={onClose}
            className="dash-btn dash-btn-ghost mb-3 px-4 py-2 text-sm"
          >
            Close
          </button>
          <div className="max-h-[82vh] overflow-y-auto rounded-3xl">
            <StudentProfileCard student={student} variant={variant} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default StudentDetail
