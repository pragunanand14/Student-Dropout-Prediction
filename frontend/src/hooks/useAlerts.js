import { useEffect, useMemo, useState } from 'react'

const useAlerts = () => {
  const [alerts, setAlerts] = useState([])
  const [summary, setSummary] = useState({
    total_alerts: 0,
    high_severity: 0,
    medium_severity: 0,
    low_severity: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchAlerts = async () => {
    setLoading(true)
    setError(null)
    setAlerts([])
    setSummary({
      total_alerts: 0,
      high_severity: 0,
      medium_severity: 0,
      low_severity: 0,
    })

    const requestSuffix = `ts=${Date.now()}`

    try {
      const [alertsResponse, summaryResponse] = await Promise.all([
        fetch(`/api/alerts?${requestSuffix}`, { cache: 'no-store' }),
        fetch(`/api/alerts-summary?${requestSuffix}`, { cache: 'no-store' }),
      ])

      if (!alertsResponse.ok || !summaryResponse.ok) {
        throw new Error('Unable to fetch alerts')
      }

      const [alertsData, summaryData] = await Promise.all([
        alertsResponse.json(),
        summaryResponse.json(),
      ])

      setAlerts(alertsData)
      setSummary(summaryData)
    } catch (fetchError) {
      setError('Failed to load alerts. Make sure backend is running on localhost:5000')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAlerts()
  }, [])

  return useMemo(() => ({
    alerts,
    summary,
    loading,
    error,
    refetch: fetchAlerts,
  }), [alerts, summary, loading, error])
}

export default useAlerts
