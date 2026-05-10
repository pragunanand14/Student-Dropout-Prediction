export const factorStyles = {
  Attendance: 'bg-blue-100 text-blue-700 border-blue-200',
  'Attendance Trend': 'bg-sky-100 text-sky-700 border-sky-200',
  Percentage: 'bg-purple-100 text-purple-700 border-purple-200',
  Engagement: 'bg-amber-100 text-amber-700 border-amber-200',
  Sentiment: 'bg-pink-100 text-pink-700 border-pink-200',
  Internet: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  'Home Support': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Stability: 'bg-slate-100 text-slate-700 border-slate-200',
}

export const mostCommonRiskFactor = (students) => {
  const counts = students.reduce((accumulator, student) => {
    const factor = student.top_factors?.[0]
    if (!factor) return accumulator
    accumulator[factor] = (accumulator[factor] || 0) + 1
    return accumulator
  }, {})

  const winner = Object.entries(counts).sort((first, second) => second[1] - first[1])[0]
  if (!winner) {
    return { factor: 'No dominant factor yet', count: 0 }
  }

  return {
    factor: winner[0],
    count: winner[1],
  }
}
