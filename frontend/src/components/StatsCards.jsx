const statConfig = {
  total: {
    label: 'Total Students',
    tone: 'from-[#1f6f78] via-[#2f8f83] to-[#3d6f8a]',
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 19a4 4 0 0 0-8 0" />
        <circle cx="12" cy="11" r="3" />
        <path d="M6 19a4 4 0 0 1 2.1-3.5M18 19a4 4 0 0 0-2.1-3.5" />
      </svg>
    ),
  },
  high_risk: {
    label: 'High Risk',
    tone: 'from-[#b84545] via-[#d46a5f] to-[#f0a46f]',
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3 2.8 19a1.2 1.2 0 0 0 1 2h16.4a1.2 1.2 0 0 0 1-2Z" />
        <path d="M12 9v4M12 17h.01" />
      </svg>
    ),
  },
  medium_risk: {
    label: 'Medium Risk',
    tone: 'from-[#d17b45] via-[#f0a46f] to-[#f6c48b]',
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M8 12h8" />
      </svg>
    ),
  },
  low_risk: {
    label: 'Low Risk',
    tone: 'from-[#2f8f83] via-[#4cc9bd] to-[#6fd9c6]',
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="m5 12 4 4L19 6" />
      </svg>
    ),
  },
}

const formatNumber = (num) => new Intl.NumberFormat().format(num)

const StatsCards = ({ stats }) => (
  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
    {Object.entries(stats).map(([key, value]) => {
      const config = statConfig[key] || statConfig.total

      return (
        <article
          key={key}
          className="group relative overflow-hidden rounded-[28px] border border-white/10 bg-white/5 p-7 shadow-[0_30px_90px_-40px_rgba(10,24,38,0.5)] backdrop-blur-2xl transition-all duration-300 hover:shadow-[0_35px_100px_-45px_rgba(10,24,38,0.6)] hover:-translate-y-1"
        >
          <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${config.tone}`} />
          <div className="flex items-start justify-between gap-5">
            <div className="flex-1">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
                {config.label}
              </p>
              <div className="flex items-baseline gap-3">
                <p className="text-4xl font-bold tracking-tight text-white drop-shadow-md">{formatNumber(value)}</p>
                <span className="rounded-full bg-white/10 border border-white/20 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-white/80 backdrop-blur-sm">
                  Live
                </span>
              </div>
            </div>
            <div className={`flex h-14 w-14 items-center justify-center rounded-[20px] bg-gradient-to-br text-white shadow-lg shadow-black/20 backdrop-blur-sm ${config.tone}`}>
              {config.icon}
            </div>
          </div>
        </article>
      )
    })}
  </div>
)

export default StatsCards

