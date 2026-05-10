import { NavLink } from 'react-router-dom'

const IconShell = ({ children, active }) => (
  <span
    className={`mr-3 flex h-10 w-10 items-center justify-center rounded-2xl transition-all duration-300 ${
      active
        ? 'bg-[linear-gradient(135deg,var(--dash-accent-strong),var(--dash-accent))] text-white shadow-lg shadow-black/10'
        : 'bg-[var(--dash-surface-2)] text-[var(--dash-muted)] ring-1 ring-[var(--dash-border)] group-hover:bg-[var(--dash-surface)]'
    }`}
  >
    {children}
  </span>
)

const icons = {
  dashboard: (active) => (
    <IconShell active={active}>
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5 transition-transform duration-300 group-hover:scale-110"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 13.5h6.5V20H4zM13.5 4H20v6.5h-6.5zM13.5 11h6.5V20h-6.5zM4 4h6.5v6.5H4z" />
      </svg>
    </IconShell>
  ),
  students: (active) => (
    <IconShell active={active}>
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5 transition-transform duration-300 group-hover:scale-110"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="9" cy="8" r="3" />
        <path d="M4 19a5 5 0 0 1 10 0" />
        <circle cx="17" cy="9" r="2.5" />
        <path d="M15.2 19a4 4 0 0 1 4.8-3.9" />
      </svg>
    </IconShell>
  ),
  analytics: (active) => (
    <IconShell active={active}>
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5 transition-transform duration-300 group-hover:scale-110"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 19h16" />
        <path d="M7 16V9" />
        <path d="M12 16V5" />
        <path d="M17 16v-4" />
        <path d="M6 9c1.3-1.6 2.8-2.5 4.4-2.7 1.7-.1 3.1.4 4.3 1.4 1.3 1 2.4 1.3 3.3 1" />
      </svg>
    </IconShell>
  ),
  reports: (active) => (
    <IconShell active={active}>
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5 transition-transform duration-300 group-hover:scale-110"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M8 3.5h7l4.5 4.5V19a1.5 1.5 0 0 1-1.5 1.5H8A1.5 1.5 0 0 1 6.5 19V5A1.5 1.5 0 0 1 8 3.5Z" />
        <path d="M15 3.5V8h4.5" />
        <path d="M9.5 12h5M9.5 15.5h5M9.5 8.5h2.5" />
      </svg>
    </IconShell>
  ),
  chatReports: (active) => (
    <IconShell active={active}>
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5 transition-transform duration-300 group-hover:scale-110"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v6A2.5 2.5 0 0 1 16.5 15H11l-4 3v-3H7.5A2.5 2.5 0 0 1 5 12.5Z" />
        <path d="M8.5 8.5h7M8.5 11.5h4.5" />
      </svg>
    </IconShell>
  ),
  settings: (active) => (
    <IconShell active={active}>
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5 transition-transform duration-500 group-hover:rotate-90 group-active:rotate-180"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2.8v2.1M12 19.1v2.1M4.9 12H2.8M21.2 12h-2.1M5.9 5.9l1.5 1.5M16.6 16.6l1.5 1.5M18.1 5.9l-1.5 1.5M7.4 16.6l-1.5 1.5" />
        <circle cx="12" cy="12" r="7.2" />
      </svg>
    </IconShell>
  ),
}

const navItems = [
  { label: 'Dashboard', to: '/dashboard', icon: icons.dashboard },
  { label: 'Students', to: '/students', icon: icons.students },
  { label: 'Analytics', to: '/analytics', icon: icons.analytics },
  { label: 'Reports', to: '/reports', icon: icons.reports },
  { label: 'Chat Reports', to: '/chat-reports', icon: icons.chatReports },
  { label: 'Settings', to: '/settings', icon: icons.settings },
]

const Sidebar = ({ onLogout }) => {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden h-screen w-64 overflow-y-auto border-r border-[var(--dash-border)] bg-[var(--dash-surface)] shadow-[0_25px_70px_-45px_rgba(15,23,42,0.35)] lg:block">
      <div className="flex min-h-full flex-col pb-4 pt-6">
        <div className="mb-8 px-6">
          <div className="inline-flex items-center gap-3 rounded-2xl border border-[var(--dash-border)] bg-[var(--dash-surface-2)] px-3 py-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--dash-accent-soft)] text-[var(--dash-accent-strong)]">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 13.5h6.5V20H4zM13.5 4H20v6.5h-6.5zM13.5 11h6.5V20h-6.5zM4 4h6.5v6.5H4z" />
              </svg>
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--dash-muted)]">Dropout</p>
              <h2 className="text-lg font-semibold text-[var(--dash-text)]">Mentor Hub</h2>
            </div>
          </div>
        </div>

        <nav className="mb-8 flex-1 space-y-2 px-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (
                `group flex items-center rounded-2xl px-4 py-3 transition-all ${
                  isActive
                    ? 'rounded-r-2xl border-r-2 border-[var(--dash-accent)] bg-[var(--dash-accent-soft)] font-medium text-[var(--dash-text)] shadow-sm'
                    : 'text-[var(--dash-muted)] hover:bg-[var(--dash-surface-2)]'
                }`
              )}
            >
              {({ isActive }) => (
                <>
                  {item.icon(isActive)}
                  <span className="text-[15px]">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-[var(--dash-border)] px-4 pb-6">
          <button
            onClick={onLogout}
            className="group flex w-full items-center rounded-2xl px-4 py-3 text-[var(--dash-danger)] transition-all hover:bg-[var(--dash-warm-soft)]"
          >
            <span className="mr-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--dash-warm-soft)] text-[var(--dash-warm)] ring-1 ring-[var(--dash-border)] transition-all duration-300 group-hover:translate-x-0.5">
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-0.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4" />
                <path d="M14 8l4 4-4 4" />
                <path d="M18 12H9" />
              </svg>
            </span>
            <span className="text-[15px]">Logout</span>
          </button>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
