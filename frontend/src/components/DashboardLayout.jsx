import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ChatbotWidget from './ChatbotWidget'
import Sidebar from './Sidebar'

const DashboardLayout = ({ title, subtitle, children, headerAction }) => {
  const navigate = useNavigate()
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'dark'
    const saved = window.localStorage.getItem('dashboard-theme')
    return saved === 'light' || saved === 'dark' ? saved : 'dark'
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    window.localStorage.setItem('dashboard-theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

  return (
    <div className={`dashboard-theme relative flex h-screen overflow-hidden ${theme === 'dark' ? 'bg-[#0c1b2a] text-white' : 'bg-[var(--dash-bg)] text-[var(--dash-text)]'}`}>
      {theme === 'dark' && (
        <>
          <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-[#1f9d8b]/40 blur-3xl" />
          <div className="pointer-events-none absolute -right-10 top-28 h-80 w-80 rounded-full bg-[#f5b74f]/30 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-1/2 h-72 w-[40rem] -translate-x-1/2 rounded-full bg-[#1c4f8a]/35 blur-3xl" />
        </>
      )}

      <Sidebar onLogout={() => navigate('/')} />
      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden lg:ml-64">
        <header className={`sticky top-0 z-30 border-b ${
          theme === 'dark' 
            ? 'border-white/10 bg-white/5 px-6 py-5 shadow-[0_25px_70px_-40px_rgba(10,24,38,0.9)] backdrop-blur-2xl sm:px-8' 
            : 'border-[var(--dash-border)] bg-[var(--dash-surface)]/90 px-5 py-4 shadow-[0_18px_40px_-32px_rgba(12,14,18,0.25)] backdrop-blur-xl sm:px-6'
        }`}>
          <div className={`flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between ${
            theme === 'dark' ? 'gap-5' : ''
          }`}>
            <div>
              <p className={theme === 'dark' ? 'text-xs font-semibold uppercase tracking-[0.4em] text-white/60' : 'dash-kicker'}>
                Student Dropout Intelligence
              </p>
              <h1 className={`${theme === 'dark' ? 'mt-2 text-3xl sm:text-4xl lg:text-5xl' : 'dash-title mt-2 text-3xl sm:text-4xl'}`} style={{ fontFamily: "'Playfair Display', serif" }}>
                {title}
              </h1>
              {subtitle ? <p className={theme === 'dark' ? 'mt-3 text-sm leading-7 text-white/70' : 'dash-muted mt-2 text-sm leading-6'}>{subtitle}</p> : null}
            </div>
            <div className="flex items-center gap-3">
              {headerAction}
              <button
                onClick={toggleTheme}
                title={`${theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}`}
                className={`rounded-full inline-flex h-12 w-12 items-center justify-center transition-all shadow-sm ${
                  theme === 'dark' 
                    ? 'bg-white/20 hover:bg-white/30 text-white' 
                    : 'dash-btn dash-btn-ghost border-[var(--dash-border)]'
                }`}
              >
                {theme === 'dark' ? (
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M18.07 6.34l-1.41 1.41" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
                  </svg>
                )}
              </button>
              <button
                onClick={() => navigate('/')}
                className={theme === 'dark' 
                  ? 'rounded-[24px] border border-white/15 bg-white/10 px-6 py-3 text-sm font-semibold text-white shadow-sm backdrop-blur-sm transition-all hover:bg-white/20 hover:shadow-md' 
                  : 'dash-btn dash-btn-warm px-4 py-2.5 text-sm'
                }
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className={`flex-1 overflow-y-auto overflow-x-hidden ${
          theme === 'dark' ? 'bg-[#0c1b2a]/95' : 'bg-[var(--dash-bg)]'
        }`}>
          <div className={`mx-auto min-h-full w-full max-w-[1680px] p-5 sm:p-6 ${
            theme === 'dark' ? 'p-6 lg:p-8 max-w-7xl' : ''
          }`}>
            {children}
          </div>
        </main>
      </div>
      <ChatbotWidget />
    </div>
  )
}

export default DashboardLayout

