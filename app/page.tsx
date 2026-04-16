'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SendHorizonal } from 'lucide-react'
import RockyAvatar, { type AvatarState } from '@/components/RockyAvatar'

/* ─── Types ───────────────────────────────────────────────────────────── */
interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  ts: number
}

/* ─── Helpers ─────────────────────────────────────────────────────────── */
function uid() {
  return Math.random().toString(36).slice(2)
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

/* ─── Bubble ──────────────────────────────────────────────────────────── */
function ChatBubble({ msg }: { msg: Message }) {
  const isRocky = msg.role === 'assistant'
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      className={`flex w-full ${isRocky ? 'justify-start' : 'justify-end'}`}
    >
      <div className={`flex flex-col gap-1 max-w-[82%] ${isRocky ? 'items-start' : 'items-end'}`}>
        <div
          className="px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap"
          style={
            isRocky
              ? {
                  background: 'var(--color-space-700)',
                  color: 'var(--color-text-primary)',
                  borderTopLeftRadius: 4,
                  border: '1px solid var(--color-space-500)',
                }
              : {
                  background: 'var(--color-eridian)',
                  color: 'var(--color-space-black)',
                  borderTopRightRadius: 4,
                  fontWeight: 500,
                }
          }
        >
          {msg.content}
        </div>
        <span
          className="text-[10px] px-1"
          style={{ color: 'var(--color-text-muted)' }}
          suppressHydrationWarning
        >
          {formatTime(msg.ts)}
        </span>
      </div>
    </motion.div>
  )
}

/* ─── Typing indicator ────────────────────────────────────────────────── */
function TypingDots() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      className="flex justify-start"
    >
      <div
        className="px-4 py-3 rounded-2xl flex gap-1.5 items-center"
        style={{
          background: 'var(--color-space-700)',
          border: '1px solid var(--color-space-500)',
          borderTopLeftRadius: 4,
        }}
      >
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="block w-1.5 h-1.5 rounded-full"
            style={{ background: 'var(--color-eridian)' }}
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.7, delay: i * 0.15, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </div>
    </motion.div>
  )
}

/* ─── Page ────────────────────────────────────────────────────────────── */
export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: uid(),
      role: 'assistant',
      content: 'Hello. I am Rocky.\n\nQuestion? You are human, yes? I detect carbon-based life signs. Also detect concerning lack of radiation shielding.\n\nFist my bump.',
      ts: Date.now(),
    },
  ])
  const [input, setInput] = useState('')
  const [avatarState, setAvatarState] = useState<AvatarState>('idle')
  const [isLoading, setIsLoading] = useState(false)
  const [apiKeyMissing, setApiKeyMissing] = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const historyRef = useRef<{ role: 'user' | 'assistant'; content: string }[]>([
    { role: 'assistant', content: messages[0].content },
  ])

  /* Auto-scroll */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  /* Register service worker */
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {})
    }
  }, [])

  /* Keyboard offset — keeps footer above the virtual keyboard on iOS PWA */
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const update = () => {
      const offset = Math.max(0, window.innerHeight - vv.offsetTop - vv.height)
      document.documentElement.style.setProperty('--kb-offset', `${offset}px`)
    }
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    return () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
    }
  }, [])

  /* Auto-resize textarea */
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
  }

  const sendMessage = useCallback(async () => {
    const text = input.trim()
    if (!text || isLoading) return

    const userMsg: Message = { id: uid(), role: 'user', content: text, ts: Date.now() }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
    }
    setIsLoading(true)
    setAvatarState('listening')

    const history = [...historyRef.current, { role: 'user' as const, content: text }]

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      })

      const data = await res.json() as { message?: string; error?: string }

      if (data.error) {
        if (data.error.includes('DEEPSEEK_API_KEY')) setApiKeyMissing(true)
        const errMsg: Message = {
          id: uid(),
          role: 'assistant',
          content: data.error.includes('DEEPSEEK_API_KEY')
            ? 'Translation matrix error. No API key detected. Stupid configuration.'
            : `Error: ${data.error}`,
          ts: Date.now(),
        }
        setMessages((prev) => [...prev, errMsg])
        setAvatarState('idle')
      } else {
        const reply = data.message ?? ''
        setAvatarState('speaking')

        // Simulate speaking time proportional to message length
        await new Promise((r) => setTimeout(r, Math.min(reply.length * 18, 2500)))

        const rockyMsg: Message = { id: uid(), role: 'assistant', content: reply, ts: Date.now() }
        setMessages((prev) => [...prev, rockyMsg])
        historyRef.current = [...history, { role: 'assistant', content: reply }]
        setAvatarState('idle')
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: 'assistant',
          content: 'Signal lost. Stupid network interference.',
          ts: Date.now(),
        },
      ])
      setAvatarState('idle')
    } finally {
      setIsLoading(false)
    }
  }, [input, isLoading])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div
      className="flex flex-col"
      style={{
        height: '100dvh',
        background: 'var(--color-space-black)',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + var(--kb-offset, 0px))',
      }}
    >
      {/* ── Header ──────────────────────────────────────────── */}
      <header
        className="flex-none flex flex-col items-center gap-2 pt-5 pb-3 px-4"
        style={{ borderBottom: '1px solid var(--color-space-700)' }}
      >
        <RockyAvatar state={avatarState} size={140} />
        <div className="text-center">
          <h1
            className="text-base font-semibold tracking-[0.18em] uppercase"
            style={{ color: 'var(--color-eridian)' }}
          >
            Rocky
          </h1>
          <p
            className="text-[11px] tracking-widest uppercase"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {avatarState === 'idle' && 'Eridian Engineer'}
            {avatarState === 'listening' && 'Receiving signal…'}
            {avatarState === 'speaking' && 'Translating chords…'}
          </p>
        </div>
      </header>

      {/* ── API key warning ──────────────────────────────────── */}
      <AnimatePresence>
        {apiKeyMissing && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex-none overflow-hidden"
          >
            <div
              className="text-xs text-center py-2 px-4"
              style={{
                background: 'var(--color-space-800)',
                color: 'var(--color-eridian-dim)',
                borderBottom: '1px solid var(--color-space-600)',
              }}
            >
              Set <code className="font-mono">DEEPSEEK_API_KEY</code> in{' '}
              <code className="font-mono">.env.local</code> to enable Rocky.
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Chat area ───────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">
        <div className="max-w-2xl mx-auto flex flex-col gap-3">
          {messages.map((msg) => (
            <ChatBubble key={msg.id} msg={msg} />
          ))}
          <AnimatePresence>{isLoading && <TypingDots />}</AnimatePresence>
          <div ref={bottomRef} />
        </div>
      </main>

      {/* ── Input bar ───────────────────────────────────────── */}
      <footer
        className="flex-none px-4 pt-3 pb-4"
        style={{ borderTop: '1px solid var(--color-space-700)' }}
      >
        <form
          className="max-w-2xl mx-auto flex items-end gap-2"
          onSubmit={(e) => { e.preventDefault(); sendMessage() }}
        >
          <div
            className="flex-1 flex items-end rounded-2xl px-4 py-3 gap-2"
            style={{
              background: 'var(--color-space-800)',
              border: '1px solid var(--color-space-600)',
            }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Speak to Rocky…"
              rows={1}
              disabled={isLoading}
              enterKeyHint="send"
              className="flex-1 bg-transparent resize-none outline-none text-sm leading-relaxed"
              style={{
                color: 'var(--color-text-primary)',
                caretColor: 'var(--color-eridian)',
                maxHeight: '120px',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            aria-label="Send message"
            className="flex-none flex items-center justify-center rounded-2xl transition-all duration-200"
            style={{
              width: 48,
              height: 48,
              minWidth: 48,
              minHeight: 48,
              background:
                input.trim() && !isLoading
                  ? 'var(--color-eridian)'
                  : 'var(--color-space-700)',
              color:
                input.trim() && !isLoading
                  ? 'var(--color-space-black)'
                  : 'var(--color-text-muted)',
              cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
            }}
          >
            <SendHorizonal size={18} strokeWidth={2} />
          </button>
        </form>

        <p
          className="text-[10px] text-center mt-2 tracking-wide"
          style={{ color: 'var(--color-text-muted)' }}
        >
          Shift + Enter for new line
        </p>
      </footer>
    </div>
  )
}
