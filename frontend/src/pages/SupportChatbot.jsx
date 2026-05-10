import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

const quickPrompts = [
  'I feel like dropping out',
  "I'm too stressed to continue",
  'I have no motivation left',
  "I'm overwhelmed with studies",
  'I feel alone',
  'My family situation is affecting my studies',
]

const supportResources = [
  {
    title: 'Talk to a counselor',
    text: 'If things have been building up for a while, a counselor can help you sort out what feels urgent and what can wait.',
  },
  {
    title: 'Reach out to a teacher or mentor',
    text: 'A trusted faculty member may be able to help with deadlines, attendance, or practical academic adjustments.',
  },
]

const welcomeMessage = {
  role: 'assistant',
  text: "Hi, I'm here to listen. You can talk to me about stress, academic pressure, burnout, or anything that's making college feel hard right now.",
  moodTags: [],
}

const feedbackOptions = [
  { value: 'satisfied', label: 'I felt supported' },
  { value: 'partly_satisfied', label: 'It helped somewhat' },
  { value: 'not_satisfied', label: 'I still need more help' },
]

const TypingBubble = () => (
  <div className="mr-8 max-w-xl rounded-[28px] rounded-bl-md border border-white/10 bg-white/10 px-4 py-3 shadow-sm">
    <div className="flex gap-2">
      <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-[#1f9d8b]/70 [animation-delay:-0.2s]" />
      <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-[#1f9d8b]/85 [animation-delay:-0.1s]" />
      <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-white" />
    </div>
  </div>
)

function SupportChatbot() {
  const chatFormRef = useRef(null)
  const [messages, setMessages] = useState([welcomeMessage])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [distressDetected, setDistressDetected] = useState(false)
  const [studentId, setStudentId] = useState('')
  const [studentName, setStudentName] = useState('')
  const [studentProfile, setStudentProfile] = useState(null)
  const [studentLookupLoading, setStudentLookupLoading] = useState(false)
  const [studentLookupError, setStudentLookupError] = useState('')
  const [sessionFinalizing, setSessionFinalizing] = useState(false)
  const [sessionEndMessage, setSessionEndMessage] = useState('')
  const [feedbackSatisfaction, setFeedbackSatisfaction] = useState('satisfied')
  const [needsHumanConsultant, setNeedsHumanConsultant] = useState(false)
  const [feedbackNote, setFeedbackNote] = useState('')
  const [sessionFinalized, setSessionFinalized] = useState(false)
  const [finalizedReportId, setFinalizedReportId] = useState(null)
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false)
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)

  const conversationHistory = useMemo(
    () => messages.map(({ role, text }) => ({ role, text })),
    [messages],
  )

  const sessionSnapshotRef = useRef({
    conversation: [welcomeMessage].map(({ role, text }) => ({ role, text })),
    studentId: '',
    studentName: '',
    feedback: {
      satisfaction: 'not_provided',
      needs_human_consultant: false,
      note: '',
    },
    finalized: false,
  })

  useEffect(() => {
    sessionSnapshotRef.current = {
      conversation: conversationHistory,
      studentId: studentProfile?.id || studentId,
      studentName: studentName.trim() || studentProfile?.name || '',
      feedback: {
        satisfaction: feedbackSatisfaction,
        needs_human_consultant: needsHumanConsultant,
        note: feedbackNote,
      },
      finalized: sessionFinalized,
    }
  }, [conversationHistory, studentId, studentName, studentProfile, feedbackSatisfaction, needsHumanConsultant, feedbackNote, sessionFinalized])

  useEffect(() => {
    const finalizeOnUnload = () => {
      const snapshot = sessionSnapshotRef.current
      if (snapshot.finalized || snapshot.conversation.length < 2) return
      const payload = {
        conversation: snapshot.conversation,
        student_id: snapshot.studentId || null,
        student_name: snapshot.studentName,
        session_end_reason: 'tab_closed',
      }
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' })
      navigator.sendBeacon('/api/support-session/finalize', blob)
    }
    window.addEventListener('beforeunload', finalizeOnUnload)
    return () => window.removeEventListener('beforeunload', finalizeOnUnload)
  }, [])

  const sendMessage = async (textOverride) => {
    const message = (textOverride ?? input).trim()
    if (!message || loading) return

    const nextUserMessage = { role: 'user', text: message, moodTags: [] }
    const nextHistory = [...conversationHistory, { role: 'user', text: message }]

    setMessages((current) => [...current, nextUserMessage])
    setInput('')
    setLoading(true)
    setSessionEndMessage('')

    try {
      const response = await fetch('/api/support-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          history: nextHistory.slice(0, -1),
        }),
      })

      const data = await response.json()
      const fallbackReply = "I'm here with you. Try sending that again if needed."
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          text: data.reply || fallbackReply,
          moodTags: data.mood_tags || [],
        },
      ])
      setDistressDetected(Boolean(data.distress_detected))
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          text: "Connection issue. Reach out to support if urgent.",
          moodTags: [],
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const clearChat = () => {
    setMessages([welcomeMessage])
    setInput('')
    setDistressDetected(false)
    setSessionEndMessage('')
    setFeedbackNote('')
    setFeedbackSatisfaction('satisfied')
    setNeedsHumanConsultant(false)
    setSessionFinalized(false)
    setFinalizedReportId(null)
    setFeedbackSubmitted(false)
  }

  const loadStudentProfile = async () => {
    const trimmedId = studentId.trim()
    if (!trimmedId) {
      setStudentLookupError('Enter student ID.')
      setStudentProfile(null)
      return
    }
    setStudentLookupLoading(true)
    setStudentLookupError('')
    try {
      const response = await fetch(`/api/student/${trimmedId}`)
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Student not found')
      setStudentProfile(data)
      setStudentName(data.name || studentName)
    } catch (error) {
      setStudentProfile(null)
      setStudentLookupError(error.message)
    } finally {
      setStudentLookupLoading(false)
    }
  }

  const endSession = async (reason = 'ended_by_student') => {
    if (sessionFinalizing || sessionFinalized) return
    setSessionFinalizing(true)
    setSessionEndMessage('')
    try {
      const response = await fetch('/api/support-session/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation: conversationHistory,
          student_id: studentProfile?.id || studentId || null,
          student_name: studentName.trim(),
          session_end_reason: reason,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to finalize.')
      setSessionEndMessage(data.message || 'Session completed.')
      setSessionFinalized(true)
      setFinalizedReportId(data.report_record?.id || null)
    } catch (error) {
      setSessionEndMessage(error.message || 'Finalize failed.')
    } finally {
      setSessionFinalizing(false)
    }
  }

  const submitFeedback = async () => {
    if (!finalizedReportId || feedbackSubmitting || feedbackSubmitted) return
    setFeedbackSubmitting(true)
    try {
      const response = await fetch(`/api/support-reports/${finalizedReportId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedback: {
            satisfaction: feedbackSatisfaction,
            needs_human_consultant: needsHumanConsultant,
            note: feedbackNote.trim(),
          },
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Feedback failed.')
      setFeedbackSubmitted(true)
      setSessionEndMessage(data.message || 'Feedback saved.')
    } catch (error) {
      setSessionEndMessage(error.message || 'Feedback failed.')
    } finally {
      setFeedbackSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0c1b2a]/95 via-[#0c1b2a] to-[#0c1b2a] relative overflow-hidden text-white/90 p-4 sm:p-6 lg:p-8" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* Orbs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-16 h-80 w-80 rounded-full bg-[#1f9d8b]/30 blur-3xl" />
        <div className="absolute -right-8 top-24 h-96 w-96 rounded-full bg-[#f5b74f]/25 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-80 w-96 -translate-x-1/2 rounded-full bg-[#1c4f8a]/30 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl h-screen flex flex-col">
        <header className="mb-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              Support Chat
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Link 
              to="/" 
              className="px-4 py-2 text-sm font-semibold rounded-[20px] border border-white/15 bg-white/5 backdrop-blur hover:bg-white/10 transition-all whitespace-nowrap"
            >
              ← Back
            </Link>
            <button 
              onClick={clearChat} 
              className="px-4 py-2 text-sm font-semibold rounded-[20px] border border-amber-400/40 bg-amber-500/10 text-amber-300 backdrop-blur hover:bg-amber-500/20 transition-all"
            >
              Clear
            </button>
          </div>
        </header>

        {/* Notices - Compact */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          <div className="p-4 rounded-[24px] border border-white/10 bg-white/5 backdrop-blur text-xs text-white/75 shadow-[0_8px_32px_rgba(10,24,38,0.4)]">
            AI assistant for support • not therapy
          </div>
          <div className="p-4 rounded-[24px] border border-emerald-400/30 bg-emerald-500/5 backdrop-blur text-xs font-semibold text-emerald-200 shadow-[0_8px_32px_rgba(10,24,38,0.4)]">
            Creates mentor report at end
          </div>
        </div>

        {/* Main Chat Container */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 h-0">
          
          {/* Chat Area */}
          <section className="flex flex-col h-full rounded-[32px] border border-white/10 bg-white/3 backdrop-blur-xl shadow-[0_35px_100px_-45px_rgba(10,24,38,0.6)] overflow-hidden">
            
            {/* Prompt Bar */}
            <div className="border-b border-white/5 bg-gradient-to-r from-slate-900/80 to-slate-800/80 p-4">
              <div className="flex flex-wrap gap-2">
                {quickPrompts.slice(0, 4).map(prompt => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => sendMessage(prompt)}
                    disabled={loading || sessionFinalized}
                    className="px-4 py-2 text-xs font-medium rounded-full border border-white/20 bg-white/5 hover:bg-white/15 backdrop-blur text-white/80 disabled:opacity-40 transition-all whitespace-nowrap"
                  >
                    {prompt.length > 18 ? prompt.slice(0,15)+'...' : prompt}
                  </button>
                ))}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 p-5 overflow-y-auto space-y-3 scroll-smooth">
              {messages.map((message, index) => (
                <div key={`${message.role}-${index}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className="max-w-xl">
                    <div className={`px-5 py-4 rounded-3xl text-sm shadow-lg ${
                      message.role === 'user'
                        ? 'rounded-bl-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-emerald-500/25'
                        : 'rounded-br-xl border border-white/10 bg-white/5 backdrop-blur text-white/90 shadow-black/10'
                    }`}>
                      {message.text}
                    </div>
                    {message.role === 'assistant' && message.moodTags?.length && (
                      <div className="mt-2 flex gap-2 flex-wrap">
                        {message.moodTags.map(tag => (
                          <span key={tag} className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && <TypingBubble />}
            </div>

            {/* Input */}
            <form 
              ref={chatFormRef} 
              onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
              className="border-t border-white/5 bg-slate-900/80 p-4"
            >
              <div className="flex gap-3">
                <textarea
                  rows="1"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      chatFormRef.current.requestSubmit()
                    }
                  }}
                  placeholder="Share what's on your mind..."
                  className="flex-1 max-h-24 rounded-[24px] border border-white/15 bg-slate-800/80 px-5 py-3 text-sm text-white/90 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30 resize-none"
                  disabled={loading || sessionFinalized}
                />
                <button
                  type="submit"
                  disabled={loading || sessionFinalized}
                  className="w-12 h-12 rounded-[24px] bg-white text-slate-900 shadow-xl hover:shadow-2xl hover:scale-[1.05] disabled:opacity-50 transition-all flex items-center justify-center font-bold text-lg"
                >
                  {loading ? '…' : '→'}
                </button>
              </div>
            </form>
          </section>

          {/* Sidebar */}
          <aside className="space-y-4 lg:max-w-xs self-start">
            
            {/* Student Context */}
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-[0_25px_70px_-35px_rgba(10,24,38,0.45)] backdrop-blur-xl">
              <h4 className="text-lg font-bold text-white mb-4">Student Context</h4>
              <div className="space-y-3">
                <input
                  type="text"
                  value={studentId}
                  onChange={e => setStudentId(e.target.value)}
                  placeholder="Last 4 roll digits"
                  className="w-full rounded-[20px] border border-white/15 bg-slate-800/80 px-4 py-3 text-sm focus:border-emerald-400"
                />
                <button
                  onClick={loadStudentProfile}
                  disabled={studentLookupLoading}
                  className="w-full rounded-[20px] bg-white/10 border border-white/20 px-4 py-3 text-sm font-bold hover:bg-white/20 transition-all disabled:opacity-50"
                >
                  {studentLookupLoading ? 'Loading…' : 'Connect'}
                </button>
              </div>
              {studentLookupError && (
                <div className="mt-4 p-3 rounded-[16px] bg-rose-500/15 border border-rose-400/40 text-xs text-rose-200">
                  {studentLookupError}
                </div>
              )}
              {studentProfile && (
                <div className="mt-4 p-4 bg-white/5 rounded-[20px]">
                  <div className="font-bold text-lg mb-1">{studentProfile.name}</div>
                  <div className="text-sm opacity-75 mb-3">ID: {studentProfile.student_lookup_id || studentProfile.id}</div>
                  <div className="flex flex-wrap gap-2">
                    {studentProfile.top_factors?.slice(0,3).map(factor => (
                      <span key={factor} className="px-3 py-1 rounded-full bg-white/10 text-xs font-bold">
                        {factor}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Resources */}
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-[0_25px_70px_-35px_rgba(10,24,38,0.45)] backdrop-blur-xl">
              <h4 className="text-lg font-bold text-white mb-4">Quick Help</h4>
              {supportResources.map((resource, index) => (
                <div key={index} className="mb-4 pb-3 border-b border-white/5 last:border-none last:mb-0">
                  <div className="font-bold text-sm text-amber-300 mb-1">{resource.title}</div>
                  <div className="text-xs opacity-80">{resource.text}</div>
                </div>
              ))}
            </div>

            {/* End Session Button - Always Visible */}
            <div>
              <button
                onClick={() => endSession()}
                disabled={sessionFinalizing || sessionFinalized}
                className="w-full rounded-[28px] border border-amber-400/40 bg-amber-500/10 px-6 py-4 text-sm font-bold text-amber-300 shadow-md hover:bg-amber-500/20 hover:shadow-lg disabled:opacity-50 transition-all backdrop-blur-xl"
              >
                {sessionFinalizing ? 'Ending Session…' : sessionFinalized ? 'Session Ended' : 'End Session'}
              </button>
            </div>
          </aside>

        </div>

        {/* Distress Notice */}
        {distressDetected && (
          <div className="mt-6 max-w-2xl mx-auto">
            <div className="p-4 rounded-[28px] border border-rose-400/40 bg-rose-500/10 text-sm font-semibold text-rose-200 shadow-lg backdrop-blur-xl">
              You deserve real support. Consider reaching out to a counselor or trusted person.
            </div>
          </div>
        )}

        {/* Full Feedback Form - Shows After End */}
        {sessionFinalized && (
          <div className="mt-8 max-w-2xl mx-auto">
            <div className="rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-[0_35px_100px_-45px_rgba(10,24,38,0.6)] backdrop-blur-2xl">
              <h3 className="text-2xl font-bold text-white mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
                Session Complete ✓
              </h3>
              <p className="text-sm text-white/75 mb-8 max-w-lg">{sessionEndMessage}</p>
              
              <div className="space-y-4 mb-8">
                {feedbackOptions.map(option => (
                  <label key={option.value} className="flex items-center gap-4 p-4 rounded-[24px] border border-white/10 bg-white/5 cursor-pointer hover:bg-white/10 transition-all">
                    <input
                      type="radio"
                      name="feedback"
                      value={option.value}
                      checked={feedbackSatisfaction === option.value}
                      onChange={e => setFeedbackSatisfaction(e.target.value)}
                      className="w-5 h-5 accent-emerald-400 text-emerald-500 bg-white/10 rounded-full border-2 border-white/20"
                    />
                    <span className="text-sm font-medium">{option.label}</span>
                  </label>
                ))}
                <label className="flex items-start gap-4 p-4 rounded-[24px] border border-amber-400/30 bg-amber-500/5 cursor-pointer hover:bg-amber-500/10 transition-all">
                  <input
                    type="checkbox"
                    checked={needsHumanConsultant}
                    onChange={e => setNeedsHumanConsultant(e.target.checked)}
                    className="mt-1 w-5 h-5 accent-amber-400 text-amber-500 bg-white/10 rounded border-2 border-white/20"
                  />
                  <span className="text-sm leading-relaxed">Need human follow-up (counselor/mentor)</span>
                </label>
              </div>

              <textarea
                rows="3"
                value={feedbackNote}
                onChange={e => setFeedbackNote(e.target.value)}
                placeholder="Optional notes about what helped or what you still need..."
                className="w-full rounded-[24px] border border-white/15 bg-slate-800/80 p-5 text-sm text-white/90 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30 resize-none mb-4"
              />

              <button
                onClick={submitFeedback}
                disabled={feedbackSubmitting || feedbackSubmitted || !finalizedReportId}
                className="w-full rounded-[24px] bg-white text-slate-900 font-bold py-4 px-8 text-lg shadow-2xl hover:shadow-3xl hover:scale-[1.02] disabled:opacity-50 transition-all"
              >
                {feedbackSubmitting ? 'Saving…' : feedbackSubmitted ? '✅ Submitted!' : 'Submit Feedback'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default SupportChatbot

