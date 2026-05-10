const formatSerialRollNumber = (student) => String(student?.id ?? '').padStart(3, '0')

export const getFilteredStudents = (students, filters) => {
  const {
    rollNumber = '',
    classFilter = '',
    riskFilter = '',
    sortBy = 'risk_score',
    sortOrder = 'desc',
  } = filters

  const filtered = [...students]
    .filter((student) => (
      rollNumber
        ? formatSerialRollNumber(student).toLowerCase().includes(rollNumber.toLowerCase())
        : true
    ))
    .filter((student) => (classFilter ? String(student.class) === String(classFilter) : true))
    .filter((student) => (riskFilter ? student.risk_level === riskFilter : true))

  filtered.sort((a, b) => {
    const aValue = sortBy === 'name' ? a.name.toLowerCase() : a[sortBy]
    const bValue = sortBy === 'name' ? b.name.toLowerCase() : b[sortBy]

    if (aValue === bValue) return 0

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1
    }

    return aValue < bValue ? 1 : -1
  })

  return filtered
}
