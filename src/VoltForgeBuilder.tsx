import {useEffect, useState} from 'react'
import {
  CheckCircle2,
  ChevronRight,
  Globe2,
  MessageCircle,
  PenLine,
  Play,
  Send,
  ShieldCheck,
  Sparkles,
  Wrench,
  AlertTriangle,
} from 'lucide-react'
import {api, ApiError} from './api'
import {
  buildExpertSpec,
  demoBuilderTemplates,
  expertDraftForBuilderMode,
  toggleAgentTool,
  type ExpertDraft,
} from './agentForm'
import {ModelPicker} from './modelCatalog'
import type {AgentSpec, BuilderSession, CatalogModel, Validation} from './types'

export const AGENT_BUILDER_VIEW = 'Agent Builder'
export const VOLT_FORGE_ASSISTANT = 'Volt Forge'

function AgentBuilderIntro({compact = false}: {compact?: boolean}) {
  return (
    <div className={`builder-intro ${compact ? 'compact' : ''}`}>
      <Sparkles size={compact ? 22 : 28} />
      <div>
        {compact ? (
          <p>
            <strong>{AGENT_BUILDER_VIEW}</strong> — tu asistente <strong>{VOLT_FORGE_ASSISTANT}</strong> te ayuda a
            construir la <em>Agent Specification</em>.
          </p>
        ) : (
          <>
            <h2>Bienvenido al {AGENT_BUILDER_VIEW}</h2>
            <p>
              Aquí defines agentes gobernables para Bia Energy. Tu asistente en esta tarea se llama{' '}
              <strong>{VOLT_FORGE_ASSISTANT}</strong>: te guía para convertir tu necesidad en una{' '}
              <em>Agent Specification</em> (propósito, herramientas, permisos, límites y criterios de evaluación)
              lista para validar y publicar.
            </p>
            <p className="intro-hint">Elige cómo quieres trabajar: conversación guiada con {VOLT_FORGE_ASSISTANT} o taller experto con campos directos.</p>
          </>
        )}
      </div>
    </div>
  )
}

const Badge = ({children, tone = 'neutral'}: {children: React.ReactNode; tone?: string}) => (
  <span className={`badge ${tone}`}>{children}</span>
)
const Spinner = () => <span className="spinner" />
const ErrorBox = ({error, onClose}: {error: string; onClose?: () => void}) => (
  <div className="alert error">
    <AlertTriangle size={18} />
    <span>{error}</span>
    {onClose && (
      <button type="button" onClick={onClose}>
        ×
      </button>
    )}
  </div>
)

type BuilderPath = 'choose' | 'guided' | 'expert'

type ToolRow = {id: string; description: string}

function SpecPanel({
  spec,
  validation,
  onValidate,
  onSave,
  onPublish,
  onDiscardDraft,
  busy,
}: {
  spec?: AgentSpec
  validation?: Validation
  onValidate: () => void
  onSave: () => void
  onPublish: () => void
  onDiscardDraft: () => void
  busy: boolean
}) {
  if (!spec)
    return (
      <div className="spec empty-spec">
        <Sparkles size={30} />
        <h3>Agent Specification</h3>
        <p>El contrato estructurado aparecerá aquí al completar la ruta guiada o el taller experto.</p>
      </div>
    )
  return (
    <div className="spec">
      <div className="spec-title">
        <div>
          <span className="eyebrow">AGENT SPECIFICATION</span>
          <h2>{spec.name}</h2>
        </div>
        <Badge tone={spec.status === 'published' ? 'success' : 'warning'}>{spec.status}</Badge>
      </div>
      <div className="spec-grid">
        <label>
          Propósito
          <p>{spec.purpose}</p>
        </label>
        <label>
          Resultado esperado
          <p>{spec.expected_output}</p>
        </label>
        <label>
          Modelo
          <p>
            <code>{spec.model_id}</code>
          </p>
        </label>
        <label>
          Herramientas
          <div className="chips">
            {spec.tools.map(t => (
              <Badge key={t}>{t}</Badge>
            ))}
          </div>
        </label>
        <label>
          Conocimiento
          <div className="chips">
            {spec.knowledge_sources.map(t => (
              <Badge tone="local" key={t}>
                {t}
              </Badge>
            ))}
          </div>
        </label>
        <label>
          Permisos
          <div className="chips">
            {spec.permissions.length ? (
              spec.permissions.map(t => (
                <Badge tone="web" key={t}>
                  {t}
                </Badge>
              ))
            ) : (
              <span>Sin permisos especiales</span>
            )}
          </div>
        </label>
        <label>
          Restricciones
          <ul>
            {spec.constraints.map(x => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </label>
        <label>
          Guardrails
          <ul>
            {spec.guardrails.map(x => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </label>
      </div>
      {validation && (
        <div className={`validation ${validation.status}`}>
          <h3>
            {validation.status === 'valid' ? <CheckCircle2 /> : <AlertTriangle />}
            {validation.status === 'valid' ? 'Especificación válida' : 'Requiere correcciones'}
          </h3>
          {validation.errors.map(x => (
            <p className="v-error" key={x}>{x}</p>
          ))}
          {validation.warnings.map(x => (
            <p className="v-warning" key={x}>{x}</p>
          ))}
          <small>{validation.passed.length} validaciones aprobadas</small>
        </div>
      )}
      <div className="actions">
        <button type="button" className="ghost" disabled={busy} onClick={onDiscardDraft}>
          Descartar borrador
        </button>
        <button type="button" className="secondary" disabled={busy} onClick={onValidate}>
          Validar
        </button>
        <button type="button" className="secondary" disabled={busy} onClick={onSave}>
          Guardar
        </button>
        <button type="button" className="primary" disabled={busy || validation?.status !== 'valid'} onClick={onPublish}>
          {busy ? <Spinner /> : <ShieldCheck size={17} />}
          Aprobar y publicar
        </button>
      </div>
    </div>
  )
}

function ModeChooser({
  onSelect,
  models,
  modelId,
  onModelChange,
}: {
  onSelect: (m: 'guided' | 'expert') => void
  models: CatalogModel[]
  modelId: string
  onModelChange: (id: string) => void
}) {
  return (
    <section className="mode-chooser">
      <AgentBuilderIntro />
      <div className="section-head">
        <div>
          <span className="eyebrow">{AGENT_BUILDER_VIEW}</span>
          <h2>¿Cómo quieres crear tu agente?</h2>
        </div>
      </div>
      <p className="mode-lead">
        Elige la ruta según tu experiencia. Ambas generan la misma Agent Specification gobernable.
      </p>
      <ModelPicker models={models} value={modelId} onChange={onModelChange} />
      <div className="mode-cards">
        <button type="button" className="mode-card" onClick={() => onSelect('guided')}>
          <MessageCircle size={28} />
          <h3>Ruta guiada</h3>
          <p>Ideal si no dominas prompting. {VOLT_FORGE_ASSISTANT} te hará una pregunta útil por turno.</p>
          <Badge tone="success">Recomendado para negocio</Badge>
        </button>
        <button type="button" className="mode-card expert" onClick={() => onSelect('expert')}>
          <Wrench size={28} />
          <h3>Taller experto</h3>
          <p>Como un GPT personalizado: defines instrucciones, herramientas, permisos y límites en un solo formulario.</p>
          <Badge>Desarrolladores y power users</Badge>
        </button>
      </div>
    </section>
  )
}

function ExpertWorkshop({
  form,
  setForm,
  models,
  tools,
  onApply,
  busy,
  liveMode,
}: {
  form: ExpertDraft
  setForm: (f: ExpertDraft) => void
  models: CatalogModel[]
  tools: ToolRow[]
  onApply: () => void
  busy: boolean
  liveMode: boolean
}) {
  function toggleTool(id: string) {
    setForm({...form, tools: toggleAgentTool(form.tools, id)})
  }
  return (
    <div className="expert-workshop card">
      <div className="panel-head">
        <div>
          <span className="eyebrow">{AGENT_BUILDER_VIEW}</span>
          <h2>Taller experto</h2>
        </div>
        <Badge tone={liveMode ? 'success' : 'demo'}>
          <PenLine size={12} /> {liveMode ? 'Tú defines todo' : 'Plantilla demo'}
        </Badge>
      </div>
      {!liveMode && (
        <div className="demo-templates expert-templates">
          <span className="eyebrow">PLANTILLAS DEMO</span>
          {demoBuilderTemplates.map(t => (
            <button
              type="button"
              key={t.id}
              className="name-option"
              onClick={() => setForm({...t.expertDraft, model_id: form.model_id})}
            >
              <strong>{t.label}</strong>
              <small>{t.description}</small>
            </button>
          ))}
        </div>
      )}
      {liveMode && (
        <p className="expert-live-hint">
          En modo live el formulario empieza vacío: define tu agente desde cero o usa la ruta guiada con {VOLT_FORGE_ASSISTANT}.
        </p>
      )}
      <ModelPicker models={models} value={form.model_id} onChange={id => setForm({...form, model_id: id})} />
      <div className="expert-form">
        <label>
          Nombre del agente
          <input
            value={form.name}
            onChange={e => setForm({...form, name: e.target.value})}
            placeholder={liveMode ? 'Ej. Asistente de cumplimiento ASG' : undefined}
          />
        </label>
        <label>
          Propósito
          <textarea
            rows={3}
            value={form.purpose}
            onChange={e => setForm({...form, purpose: e.target.value})}
            placeholder={liveMode ? '¿Qué problema resuelve este agente y para quién?' : undefined}
          />
        </label>
        <label>
          Usuarios objetivo
          <input
            value={form.target_users}
            onChange={e => setForm({...form, target_users: e.target.value})}
            placeholder={liveMode ? 'Equipos o roles que lo usarán' : undefined}
          />
        </label>
        <label>
          Alcance
          <input
            value={form.scope}
            onChange={e => setForm({...form, scope: e.target.value})}
            placeholder={liveMode ? 'Temas permitidos y límites de dominio' : undefined}
          />
        </label>
        <label>
          Descripción de entrada
          <textarea
            rows={2}
            value={form.input_description}
            onChange={e => setForm({...form, input_description: e.target.value})}
            placeholder={liveMode ? 'Tipo de preguntas o comandos que recibirá' : undefined}
          />
        </label>
        <label>
          Resultado esperado
          <textarea
            rows={2}
            value={form.expected_output}
            onChange={e => setForm({...form, expected_output: e.target.value})}
            placeholder={liveMode ? 'Formato y contenido de la respuesta ideal' : undefined}
          />
        </label>
        <label className="full">
          Instrucciones del sistema
          <textarea
            rows={6}
            value={form.instructions}
            onChange={e => setForm({...form, instructions: e.target.value})}
            placeholder={liveMode ? 'Comportamiento, tono, pasos obligatorios y uso de fuentes' : undefined}
          />
        </label>
        <label>
          <span>Aprobación humana en acciones sensibles</span>
          <input type="checkbox" checked={form.human_approval} onChange={e => setForm({...form, human_approval: e.target.checked})} />
        </label>
        <label className="full">
          Herramientas
          <div className="tool-checks">
            {tools.map(t => (
              <label key={t.id} className="tool-check">
                <input type="checkbox" checked={form.tools.includes(t.id)} onChange={() => toggleTool(t.id)} />
                <span>
                  <strong>{t.id}</strong>
                  <small>{t.description}</small>
                </span>
              </label>
            ))}
          </div>
        </label>
        <label>
          Restricciones (una por línea)
          <textarea rows={3} value={form.constraints} onChange={e => setForm({...form, constraints: e.target.value})} />
        </label>
        <label>
          Guardrails (una por línea)
          <textarea rows={3} value={form.guardrails} onChange={e => setForm({...form, guardrails: e.target.value})} />
        </label>
        <label>
          Criterios de evaluación (uno por línea)
          <textarea rows={2} value={form.evaluation_criteria} onChange={e => setForm({...form, evaluation_criteria: e.target.value})} />
        </label>
        {form.tools.includes('web_search') && (
          <>
            <label>
              Cuándo permitir web (una condición por línea)
              <textarea rows={2} value={form.web_allowed_when} onChange={e => setForm({...form, web_allowed_when: e.target.value})} />
            </label>
            <label className="full">
              Si no hay resultados web
              <textarea rows={2} value={form.web_no_results} onChange={e => setForm({...form, web_no_results: e.target.value})} />
            </label>
          </>
        )}
      </div>
      <div className="actions expert-actions">
        <button type="button" className="primary" disabled={busy} onClick={onApply}>
          {busy ? <Spinner /> : <Sparkles size={17} />}
          Generar especificación
        </button>
      </div>
    </div>
  )
}

export function VoltForgeBuilder({
  refresh,
  onTrace,
  onOpenAgentChat,
}: {
  refresh: () => void
  onTrace: (id: string) => void
  onOpenAgentChat?: (agent: AgentSpec, allowDraft: boolean) => void
}) {
  const [path, setPath] = useState<BuilderPath>('choose')
  const [session, setSession] = useState<BuilderSession>()
  const [input, setInput] = useState('')
  const [llmMode, setLlmMode] = useState<'demo' | 'live'>('live')
  const [spec, setSpec] = useState<AgentSpec>()
  const [validation, setValidation] = useState<Validation>()
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [expertForm, setExpertForm] = useState<ExpertDraft>(() => expertDraftForBuilderMode('live', 'groq-default'))
  const [selectedModelId, setSelectedModelId] = useState('groq-default')
  const [models, setModels] = useState<CatalogModel[]>([])
  const [tools, setTools] = useState<ToolRow[]>([])
  const [persisted, setPersisted] = useState(false)

  useEffect(() => {
    api.models().then(setModels).catch(() => {})
    api.tools().then(setTools).catch(() => {})
    api.health().then(h => setLlmMode(h.mode === 'live' ? 'live' : 'demo')).catch(() => {})
  }, [])

  function discardDraft() {
    setSpec(undefined)
    setValidation(undefined)
    setSaved(false)
    setPersisted(false)
    if (path === 'guided') {
      setSession(undefined)
      setInput('')
    }
    if (path === 'expert') {
      setExpertForm(expertDraftForBuilderMode(llmMode, selectedModelId))
    }
  }

  function resetPath() {
    setPath('choose')
    setSession(undefined)
    setSpec(undefined)
    setValidation(undefined)
    setSaved(false)
    setPersisted(false)
    setError('')
    setExpertForm(expertDraftForBuilderMode(llmMode, selectedModelId))
  }

  async function send(skip = false, fixedText?: string) {
    if (!session && !input.trim()) return
    if (session && session.state !== 'naming' && !skip && !fixedText && !input.trim()) return
    setBusy(true)
    setError('')
    try {
      const text = fixedText ?? (skip ? '' : input)
      const s = session
        ? await api.message(session.session_id, text)
        : await api.createSession(input, selectedModelId)
      setSession(s)
      setSpec(s.draft_spec)
      setInput('')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function applyExpert() {
    setBusy(true)
    setError('')
    try {
      const draft = buildExpertSpec(expertForm)
      setSpec(draft)
      setValidation(undefined)
      setSaved(false)
      setPersisted(false)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function validate() {
    if (!spec) return
    setBusy(true)
    try {
      setValidation(await api.validate(spec))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function save() {
    if (!spec) return
    setBusy(true)
    try {
      if (persisted) await api.updateAgent(spec.id, spec)
      else {
        try {
          await api.createAgent(spec)
        } catch (e) {
          if ((e as ApiError).code !== 'AGENT_EXISTS') throw e
        }
      }
      setSaved(true)
      setPersisted(true)
      refresh()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function publish() {
    if (!spec) return
    setBusy(true)
    try {
      if (!persisted) {
        try {
          await api.createAgent(spec)
        } catch (e) {
          if ((e as ApiError).code !== 'AGENT_EXISTS') throw e
          await api.updateAgent(spec.id, spec)
        }
        setPersisted(true)
      } else {
        await api.updateAgent(spec.id, spec)
      }
      const p = await api.publish(spec.id)
      setSpec(p)
      setSaved(true)
      refresh()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  if (path === 'choose') {
    return (
      <ModeChooser
        onSelect={m => {
          setPath(m)
          if (m === 'expert') {
            setExpertForm(expertDraftForBuilderMode(llmMode, selectedModelId))
          }
        }}
        models={models}
        modelId={selectedModelId}
        onModelChange={id => {
          setSelectedModelId(id)
          setExpertForm(f => ({...f, model_id: id}))
        }}
      />
    )
  }

  return (
    <>
      <AgentBuilderIntro compact />
      <div className="builder-toolbar">
        <div className="builder-toolbar-actions">
          <button type="button" className="ghost" onClick={resetPath}>← Cambiar ruta</button>
          <button type="button" className="ghost" onClick={discardDraft}>Descartar y volver a crear</button>
        </div>
        <div className="copilot-modes">
          <span>{AGENT_BUILDER_VIEW}</span>
          <Badge tone={path === 'guided' ? 'success' : 'neutral'}>Ruta guiada</Badge>
          <Badge tone={path === 'expert' ? 'success' : 'neutral'}>Taller experto</Badge>
          <Badge>Review · Validación en panel</Badge>
        </div>
      </div>
      <div className="builder-layout">
        {path === 'guided' ? (
          <div className="chat card">
            <div className="panel-head">
              <div>
                <span className="eyebrow">{AGENT_BUILDER_VIEW}</span>
                <h2>Ruta guiada</h2>
              </div>
              <Badge tone={llmMode === 'live' ? 'success' : 'demo'}>
                {llmMode === 'live' ? `${VOLT_FORGE_ASSISTANT} · modelo en vivo` : `${VOLT_FORGE_ASSISTANT} · guión demo`}
              </Badge>
            </div>
            <div className="guided-model-wrap">
              <ModelPicker models={models} value={selectedModelId} onChange={setSelectedModelId} />
            </div>
            <div className="progress">
              <div style={{width: `${session?.progress || 0}%`}} />
              <span>{session?.progress || 0}%</span>
            </div>
            <div className="messages">
              {!session && (
                <div className="welcome">
                  <Sparkles />
                  <h3>Describe el agente que necesitas</h3>
                  <p>
                    {llmMode === 'live'
                      ? `${VOLT_FORGE_ASSISTANT} conversará contigo para definir cualquier agente especializado y generará la especificación.`
                      : `${VOLT_FORGE_ASSISTANT} seguirá un guión de preguntas (modo demo). Puedes usar una plantilla de ejemplo:`}
                  </p>
                  {llmMode === 'demo' && (
                    <div className="demo-templates">
                      {demoBuilderTemplates.map(t => (
                        <button
                          type="button"
                          key={t.id}
                          className="name-option"
                          onClick={() => setInput(t.guidedInput)}
                        >
                          <strong>{t.label}</strong>
                          <small>{t.description}</small>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {session?.messages.map((m, i) => (
                <div className={`message ${m.role}`} key={i}>
                  <span>{m.role === 'assistant' ? VOLT_FORGE_ASSISTANT : 'Tú'}</span>
                  <p>{m.content}</p>
                </div>
              ))}
              {busy && (
                <div className="message assistant">
                  <Spinner />
                </div>
              )}
            </div>
            {session?.state === 'naming' && session.name_suggestions && (
              <div className="name-suggestions">
                <span className="eyebrow">NOMBRE DEL AGENTE</span>
                <p>
                  Elige cómo aparecerá en Dashboard y Agentes:
                  {session.name_suggestions_source === 'llm' ? (
                    <Badge tone="success">Sugeridos por modelo en vivo</Badge>
                  ) : (
                    <Badge tone="demo">Sugeridos en modo asistido</Badge>
                  )}
                </p>
                <div className="name-options">
                  {session.name_suggestions.map((name, i) => (
                    <button type="button" key={name} className="name-option" disabled={busy} onClick={() => send(false, name)}>
                      <strong>{i + 1}.</strong> {name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {session?.current_question && session.state !== 'naming' && (
              <div className="question-hint">
                <strong>Ayuda:</strong> {session.current_question.hint}
              </div>
            )}
            {error && <ErrorBox error={error} onClose={() => setError('')} />}
            <div className="composer">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    send(false)
                  }
                }}
                placeholder={
                  session?.state === 'naming'
                    ? 'O escribe un nombre personalizado y envía...'
                    : llmMode === 'live'
                      ? 'Ej.: agente de onboarding interno, soporte ASG, revisión de contratos…'
                      : 'Describe tu agente o responde la pregunta…'
                }
              />
              <button type="button" onClick={() => send(false)} disabled={busy}>
                <Send size={18} />
              </button>
            </div>
            {session && session.state !== 'naming' && session.pending_fields?.length > 0 && (
              <div className="composer-secondary">
                <button type="button" className="ghost" disabled={busy} onClick={() => send(true)}>
                  Omitir — que {VOLT_FORGE_ASSISTANT} elija
                </button>
              </div>
            )}
          </div>
        ) : (
          <ExpertWorkshop
            form={expertForm}
            setForm={setExpertForm}
            models={models}
            tools={tools}
            onApply={applyExpert}
            busy={busy}
            liveMode={llmMode === 'live'}
          />
        )}
        <SpecPanel
          spec={spec}
          validation={validation}
          onValidate={validate}
          onSave={save}
          onPublish={publish}
          onDiscardDraft={discardDraft}
          busy={busy}
        />
      </div>
      {error && path === 'expert' && <ErrorBox error={error} onClose={() => setError('')} />}
      {spec?.status === 'published' && onOpenAgentChat && (
        <section className="runner">
          <div className="section-head">
            <div>
              <span className="eyebrow">AGENT RUNTIME</span>
              <h2>Conversar con el agente</h2>
              <p className="section-lead">Abre el chat para mantener un hilo con contexto, no solo una consulta aislada.</p>
            </div>
          </div>
          <button type="button" className="primary" onClick={() => onOpenAgentChat(spec, false)}>
            <Play size={17} /> Abrir chat con {spec.name}
          </button>
        </section>
      )}
      {spec?.status === 'draft' && persisted && onOpenAgentChat && (
        <section className="runner">
          <div className="section-head">
            <div>
              <span className="eyebrow">PRUEBA</span>
              <h2>Probar en chat (borrador)</h2>
            </div>
          </div>
          <button type="button" className="secondary" onClick={() => onOpenAgentChat(spec, true)}>
            <Play size={17} /> Abrir chat de prueba
          </button>
        </section>
      )}
    </>
  )
}
