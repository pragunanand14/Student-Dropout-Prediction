import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  const handleLogin = (e) => {
    e.preventDefault()
    // Fake auth - always redirect
    navigate('/dashboard')
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0c1b2a] px-4 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-[#1f9d8b]/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-10 top-28 h-80 w-80 rounded-full bg-[#f5b74f]/30 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-72 w-[40rem] -translate-x-1/2 rounded-full bg-[#1c4f8a]/35 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-5xl items-center py-16">
        <div className="grid w-full gap-10 rounded-[36px] border border-white/10 bg-white/5 p-6 shadow-[0_40px_120px_-60px_rgba(10,24,38,0.9)] backdrop-blur-2xl md:grid-cols-[1.1fr_0.9fr] md:p-10">
          <div className="flex flex-col justify-between gap-10 rounded-[28px] bg-gradient-to-br from-[#10283f] via-[#10283f] to-[#163e5a] p-8 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/60">Dropout Intelligence</p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">
                AI Student Dropout Prediction
              </h1>
              <p className="mt-4 text-sm leading-6 text-white/70">
                A focused control room for early risk signals, attendance trends, and support workflows.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/60">Coverage</p>
                <p className="mt-2 text-2xl font-semibold">40 students</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/60">Live alerts</p>
                <p className="mt-2 text-2xl font-semibold">Always on</p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-semibold text-white/90">Student-facing support</p>
              <p className="mt-2 text-sm leading-6 text-white/70">
                A private support assistant is available for students who want a calm space to talk through stress,
                burnout, pressure, or personal struggles affecting their studies.
              </p>
              <Link
                to="/support-chat"
                className="mt-4 inline-flex rounded-xl bg-white px-4 py-3 text-sm font-semibold text-[#0c1b2a] transition hover:bg-white/90"
              >
                Open Student Support Consultant
              </Link>
            </div>
          </div>

          <div className="flex flex-col justify-center rounded-[28px] bg-white p-8 shadow-[0_30px_80px_-60px_rgba(15,23,42,0.6)]">
            <div className="mb-8">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">Faculty Login</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">Sign in to your account</h2>
              <p className="mt-2 text-sm text-slate-500">Use your official credentials to access the dashboard.</p>
            </div>

            <form className="space-y-5" onSubmit={handleLogin}>
              <div>
                <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-200"
                  placeholder="name@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-200"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-2xl bg-[#0c1b2a] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#132a3f]"
              >
                Sign in
              </button>
            </form>

            <p className="mt-6 text-xs text-slate-400">
              By continuing, you agree to handle student data responsibly.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login

