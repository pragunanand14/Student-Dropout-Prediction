import { useEffect, useState } from 'react'

const useDashboardData = () => {
  const [stats, setStats] = useState({})
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    setStats({})
    setStudents([])

    const requestSuffix = `ts=${Date.now()}`

    try {
      const [statsRes, studentsRes] = await Promise.all([
        fetch(`/api/dashboard-stats?${requestSuffix}`, { cache: 'no-store' }),
        fetch(`/api/students?${requestSuffix}`, { cache: 'no-store' }),
      ])

      if (!statsRes.ok || !studentsRes.ok) {
        throw new Error('Unable to fetch dashboard data')
      }

      const [statsData, studentsData] = await Promise.all([
        statsRes.json(),
        studentsRes.json(),
      ])

      setStats(statsData)
      setStudents(studentsData)
    } catch (err) {
      setError('Failed to load dashboard data. Make sure backend is running on localhost:5000')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return {
    stats,
    students,
    loading,
    error,
    refetch: fetchData,
  }
}

export default useDashboardData
