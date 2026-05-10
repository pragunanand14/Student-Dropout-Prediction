const averageRiskScore = (students) => {
  if (!students.length) return 0
  return Math.round(students.reduce((sum, student) => sum + student.risk_score, 0) / students.length)
}

export const buildAnalyticsInsights = (students) => {
  if (!students.length) {
    return []
  }

  const poorInternet = students.filter((student) => student.internet_access === 'Poor')
  const goodInternet = students.filter((student) => student.internet_access === 'Good')
  const poorInternetRisk = averageRiskScore(poorInternet)
  const goodInternetRisk = averageRiskScore(goodInternet)

  const sectionGroups = students.reduce((accumulator, student) => {
    const key = `${student.class}${student.section}`
    if (!accumulator[key]) {
      accumulator[key] = []
    }
    accumulator[key].push(student)
    return accumulator
  }, {})

  const sectionSummary = Object.entries(sectionGroups)
    .map(([section, sectionStudents]) => {
      const mediumRiskCount = sectionStudents.filter((student) => student.risk_level === 'Medium').length
      return {
        section,
        mediumRiskCount,
        mediumRiskRate: mediumRiskCount / sectionStudents.length,
        total: sectionStudents.length,
      }
    })
    .sort((first, second) => second.mediumRiskRate - first.mediumRiskRate)[0]

  const parentEducationGroups = students.reduce((accumulator, student) => {
    if (!accumulator[student.parent_education]) {
      accumulator[student.parent_education] = []
    }
    accumulator[student.parent_education].push(student)
    return accumulator
  }, {})

  const highestRiskEducation = Object.entries(parentEducationGroups)
    .map(([label, groupStudents]) => ({
      label,
      avgRisk: averageRiskScore(groupStudents),
    }))
    .sort((first, second) => second.avgRisk - first.avgRisk)[0]

  return [
    {
      title: 'Internet Access Pattern',
      description: poorInternet.length && goodInternet.length
        ? `Students with poor internet average a risk score of ${poorInternetRisk}, compared with ${goodInternetRisk} for students with good internet.`
        : 'Add more internet-access data to compare connectivity patterns.',
      tone: 'blue',
    },
    {
      title: 'Section Watchlist',
      description: sectionSummary
        ? `Section ${sectionSummary.section} has the highest share of medium-risk students at ${Math.round(sectionSummary.mediumRiskRate * 100)}% (${sectionSummary.mediumRiskCount} of ${sectionSummary.total}).`
        : 'No section pattern is available yet.',
      tone: 'amber',
    },
    {
      title: 'Parent Education Signal',
      description: highestRiskEducation
        ? `Students whose parent education group is ${highestRiskEducation.label} currently show the highest average risk score at ${highestRiskEducation.avgRisk}.`
        : 'Parent education trends are not available yet.',
      tone: 'emerald',
    },
  ]
}
