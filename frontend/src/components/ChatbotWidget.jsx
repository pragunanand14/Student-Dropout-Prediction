import { useState } from 'react'
import { useNavigate } from 'react-router-dom'  // Optional if needed, but preserve original logic

const starterQuestions = [
  'Show overall summary',
  'Who has the lowest percentage?',
  'Which class has the most high-risk students?',
]

const TypingBubble = () => (
  <div className="mr-12 max-w-xl rounded-[28px] rounded-bl-md border border-white/10 bg-white/10 px-5 py-4 shadow-sm">
    <div className="flex gap-2">
      <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-[#1f9d8b]/70 [animation-delay:-0.2s]" />
      <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-[#1f9d8b]/85 [animation-delay:-0.1s]" />
      <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-white" />
    </div>
  </div>
)

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'I can answer broader questions about this dashboard, including student status, class summaries, attendance, percentage scores, grades, alerts, and risk factors.',
      suggestions: starterQuestions,
    },
  ])
  const [loading, setLoading] = useState(false)

  const sendMessage = async (textToSend) => {
    const trimmed = textToSend.trim()
    if (!trimmed || loading) return

    setMessages((current) => [...current, { role: 'user', text: trimmed }])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: trimmed }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to contact chatbot')
      }

      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          text: data.reply,
          suggestions: data.suggestions || [],
        },
      ])
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          text: 'I could not reach the chatbot service. Make sure the Flask backend is running.',
          suggestions: starterQuestions,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Decorative orbs for glassmorphism theme */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-[#1f9d8b]/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-8 left-1/2 h-24 w-48 -translate-x-1/2 rounded-full bg-[#f5b74f]/25 blur-3xl" />

      {isOpen ? (
        <div className="w-[400px] max-w-[calc(100vw-2.5rem)] overflow-hidden rounded-[32px] border border-white/10 bg-white/5 shadow-[0_40px_120px_-60px_rgba(10,24,38,0.9)] backdrop-blur-2xl">
          {/* Header */}
          <div className="flex items-center justify-between bg-gradient-to-r from-[#1f9d8b] to-[#1c4f8a] px-6 py-5">
            <div>
              <h3 className="text-xl font-bold text-white font-[Playfair_Display,serif]">Dashboard Assistant</h3>
              <p className="text-xs text-white/80">Ask about students, risks, alerts, and data</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-full bg-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/30"
            >
              Close
            </button>
          </div>

          {/* Messages */}
          <div className="max-h-[420px] space-y-4 overflow-y-auto bg-[rgba(16,40,63,0.8)] p-6">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xl ${message.role === 'user' ? 'ml-4' : 'mr-4'}`}>
                  <div
                    className={`rounded-[28px] px-5 py-4 text-sm leading-7 shadow-sm ${
                      message.role === 'user'
                        ? 'rounded-br-md bg-gradient-to-r from-[#1f9d8b] to-[#1c4f8a] text-white'
                        : 'rounded-bl-md border border-white/10 bg-white/10 text-white/90'
                    }`}
                  >
                    {message.text}
                  </div>
                  {message.role === 'assistant' && message.suggestions?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {message.suggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => sendMessage(suggestion)}
                          className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white/80 transition hover:bg-white/20 hover:text-white"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && <TypingBubble />}
          </div>

          {/* Input Form */}
          <form
            onSubmit={(event) => {
              event.preventDefault()
              sendMessage(input)
            }}
            className="border-t border-white/10 bg-[#10283f]/90 p-6"
          >
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask about classes, risks, attendance, scores..."
                className="flex-1 rounded-[28px] border border-white/15 bg-[#0f2235]/90 px-5 py-4 text-sm leading-6 text-white/90 outline-none transition-all focus:border-[#1f9d8b] focus:ring-4 focus:ring-[#1f9d8b]/30"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading}
                className="rounded-[28px] bg-white px-6 py-4 text-sm font-bold text-[#0c1b2a] shadow-lg shadow-black/30 transition-all hover:bg-white/95 hover:shadow-xl hover:shadow-black/40 disabled:cursor-not-allowed disabled:opacity-70 flex-shrink-0"
              >
                {loading ? '...' : 'Send'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#1f9d8b] via-[#1c4f8a] to-[#1f9d8b] text-white shadow-2xl shadow-[0_20px_60px_rgba(31,157,139,0.4)] transition-all hover:scale-110 hover:shadow-[0_25px_70px_rgba(31,157,139,0.5)] active:scale-95"
        >
          <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 12h8" />
            <path d="M12 8v8" />
          </svg>
        </button>
      )}
    </div>
  )
}

export default ChatbotWidget

