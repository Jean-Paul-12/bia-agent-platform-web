import {useEffect, useRef, useState} from 'react'
import {
  ArrowLeft,
  Bot,
  ChevronRight,
  Clock,
  ExternalLink,
  Globe2,
  RotateCcw,
  Send,
} from 'lucide-react'
import {api} from './api'
import type {AgentSpec, ChatTurn, RunResult, Source} from './types'

const Badge = ({children, tone = 'neutral'}: {children: React.ReactNode; tone?: string}) => (
  <span className={`badge ${tone}`}>{children}</span>
)
const Spinner = () => <span className="spinner" />

type ThreadMessage = {
  role: 'user' | 'assistant'
  content: string
  run?: RunResult
}

function SourcesBlock({sources}: {sources: Source[]}) {
  if (!sources.length) return null
  return (
    <details className="chat-sources">
      <summary>Fuentes de este turno ({sources.length})</summary>
      <div className="sources">
        {sources.map((s, i) => (
          <div className="source" key={i}>
            <Badge tone={s.type === 'local' ? 'local' : s.type === 'demo' ? 'demo' : 'web'}>{s.type}</Badge>
            <div>
              <strong>{s.title}</strong>
              <p>{s.snippet.slice(0, 140)}…</p>
              {s.url && (
                <a href={s.url} target="_blank" rel="noreferrer">
                  {s.url}
                  <ExternalLink size={12} />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </details>
  )
}

export function AgentChatView({
  agent,
  allowDraft,
  onBack,
  onTrace,
}: {
  agent: AgentSpec
  allowDraft: boolean
  onBack: () => void
  onTrace?: (traceId: string) => void
}) {
  const [thread, setThread] = useState<ThreadMessage[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setThread([])
    setInput('')
    setError('')
  }, [agent.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({behavior: 'smooth'})
  }, [thread, busy])

  async function send() {
    const text = input.trim()
    if (!text || busy) return
    setInput('')
    setBusy(true)
    setError('')
    const history: ChatTurn[] = thread.map(m => ({role: m.role, content: m.content}))
    setThread(prev => [...prev, {role: 'user', content: text}])
    try {
      const result = await api.run(agent.id, text, {allow_draft: allowDraft, history})
      setThread(prev => [...prev, {role: 'assistant', content: result.output, run: result}])
    } catch (e) {
      setThread(prev => prev.slice(0, -1))
      setInput(text)
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  function resetChat() {
    setThread([])
    setInput('')
    setError('')
  }

  const welcome = `Hola, soy ${agent.name}. ${agent.purpose} ¿En qué puedo ayudarte?`

  return (
    <section className="agent-chat-page">
      <div className="agent-chat-toolbar">
        <button type="button" className="ghost" onClick={onBack}>
          <ArrowLeft size={16} /> Volver a agentes
        </button>
        <div className="agent-chat-title">
          <div className="agent-icon"><Bot /></div>
          <div>
            <h2>{agent.name}</h2>
            <p>{agent.purpose}</p>
          </div>
        </div>
        <div className="agent-chat-badges">
          <Badge tone={allowDraft ? 'demo' : 'success'}>{allowDraft ? 'Prueba en borrador' : 'Publicado'}</Badge>
          {agent.permissions.includes('internet_access') && (
            <Badge tone="web">
              <Globe2 size={12} /> Web
            </Badge>
          )}
          <button type="button" className="ghost" onClick={resetChat} disabled={busy || thread.length === 0}>
            <RotateCcw size={14} /> Nueva conversación
          </button>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}

      <div className="agent-chat-layout card">
        <div className="messages agent-chat-messages">
          <div className="message assistant">
            <span>{agent.name}</span>
            <p>{welcome}</p>
          </div>
          {thread.map((m, i) => (
            <div className={`message ${m.role}`} key={i}>
              <span>{m.role === 'user' ? 'Tú' : agent.name}</span>
              <p>{m.content}</p>
              {m.run && (
                <div className="chat-turn-meta">
                  <Badge tone={m.run.knowledge_source === 'local' ? 'local' : 'web'}>{m.run.knowledge_source}</Badge>
                  {m.run.draft_run && <Badge tone="demo">Borrador</Badge>}
                  <span>
                    <Clock size={12} />
                    {m.run.latency_ms} ms
                  </span>
                  {onTrace && (
                    <button type="button" className="ghost tiny" onClick={() => onTrace(m.run!.trace_id)}>
                      Traza <ChevronRight size={12} />
                    </button>
                  )}
                </div>
              )}
              {m.run?.sources && <SourcesBlock sources={m.run.sources} />}
            </div>
          ))}
          {busy && (
            <div className="message assistant">
              <span>{agent.name}</span>
              <p className="typing"><Spinner /> Pensando…</p>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        <div className="composer agent-chat-composer">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send()
              }
            }}
            placeholder="Escribe tu mensaje… (Enter para enviar, Shift+Enter para nueva línea)"
            rows={2}
            disabled={busy}
          />
          <button type="button" onClick={send} disabled={busy || !input.trim()} aria-label="Enviar">
            <Send size={18} />
          </button>
        </div>
      </div>
    </section>
  )
}
