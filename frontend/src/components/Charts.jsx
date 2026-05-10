import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const tooltipStyle = {
  borderRadius: '18px',
  border: '1px solid var(--dash-border)',
  background: 'var(--dash-surface)',
  color: 'var(--dash-text)',
  boxShadow: '0 20px 45px -24px rgba(15, 23, 42, 0.18)',
}

const chartCard = 'dash-card p-6'

const Charts = ({ students }) => {
  const classCounts = {}
  students.forEach((student) => {
    const key = `Class ${student.class}`
    classCounts[key] = (classCounts[key] || 0) + 1
  })
  const barData = Object.entries(classCounts).map(([name, count]) => ({ name, students: count }))

  const avgAttendanceByClass = {}
  students.forEach((student) => {
    if (!avgAttendanceByClass[student.class]) avgAttendanceByClass[student.class] = []
    avgAttendanceByClass[student.class].push(student.attendance)
  })
  const lineData = Object.entries(avgAttendanceByClass)
    .map(([cls, attendanceValues]) => ({
      class: `Class ${cls}`,
      avgAttendance: attendanceValues.reduce((sum, value) => sum + value, 0) / attendanceValues.length,
      classNum: cls,
    }))
    .sort((a, b) => a.classNum - b.classNum)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className={chartCard}>
          <div className="mb-6">
            <p className="dash-kicker">Enrollment</p>
            <h3 className="mt-2 text-xl font-semibold tracking-tight text-[var(--dash-text)]">Students by class</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} barSize={34}>
                <CartesianGrid stroke="var(--dash-border)" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="students" fill="#1f6f78" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className={chartCard}>
          <div className="mb-6">
            <p className="dash-kicker">Attendance</p>
            <h3 className="mt-2 text-xl font-semibold tracking-tight text-[var(--dash-text)]">Class attendance trend</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData}>
                <CartesianGrid stroke="var(--dash-border)" vertical={false} />
                <XAxis dataKey="class" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line
                  type="monotone"
                  dataKey="avgAttendance"
                  stroke="#2f8f83"
                  strokeWidth={3}
                  dot={{ fill: '#2f8f83', strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6, fill: '#2f8f83' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </div>
  )
}

export default Charts
