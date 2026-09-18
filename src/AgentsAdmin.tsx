import {useEffect, useState} from 'react'
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  ChevronRight,
  FlaskConical,
  Globe2,
  Pencil,
  Play,
  Plus,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react'
import {api, ApiError} from './api'
import {agentToExpertDraft, buildExpertSpec, defaultExpertDraft, toggleAgentTool, type ExpertDraft} from './agentForm'
import {ModelPicker} from './modelCatalog'
import type {AgentSpec, CatalogModel, Validation} from './types'

const Badge = ({children, tone = 'neutral'}: {children: React.ReactNode; tone?: string}) => (
  <span className={`badge ${tone}`}>{children}</span>
)
const Spinner = () => <span className="spinner" />

type PanelTab = 'edit' | 'lifecycle'

function statusLabel(status: AgentSpec['status']) {
  if (status === 'published') return 'Publicado'
  if (status === 'validated') return 'Validado'
  return 'Borrador'
}

export function AgentsAdmin({
  agents,
  refresh,
  onCreate,
  onOpenChat,
}: {
  agents: AgentSpec[]
  refresh: () => void
  onCreate: () => void
  onOpenChat: (agent: AgentSpec, allowDraft: boolean) => void
}) {
  const [selected, setSelected] = useState<AgentSpec | null>(null)
  const [tab, setTab] = useState<PanelTab>('edit')
  const [form, setForm] = useState<ExpertDraft>(defaultExpertDraft)
  const [models, setModels] = useState<CatalogModel[]>([])
  const [tools, setTools] = useState<{id: string; description: string}[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [validation, setValidation] = useState<Validation>()
  const [deleteTarget, setDeleteTarget] = useState<AgentSpec | null>(null)

  useEffect(() => {
    api.models().then(setModels).catch(() => {})
    api.tools().then(setTools).catch(() => {})
  }, [])

  function openPanel(agent: AgentSpec, initialTab: PanelTab = 'edit') {
    setSelected(agent)
    setTab(initialTab)
    setForm(agentToExpertDraft(agent))
    setValidation(undefined)
    setError('')
  }

  function closePanel() {
    setSelected(null)
    setForm(defaultExpertDraft)
    setValidation(undefined)
    setError('')
  }

  function currentSpecFromForm(): AgentSpec | null {
    if (!selected) return null
    return buildExpertSpec(form, {...selected, status: selected.status})
  }

  async function saveEdit() {
    if (!selected) return
    setBusy(true)
    setError('')
    try {
      const spec = buildExpertSpec(form, {...selected, status: 'draft'})
      const updated = await api.updateAgent(selected.id, spec)
      setSelected(updated)
      setValidation(undefined)
      refresh()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function validateAgent() {
    const spec = currentSpecFromForm()
    if (!spec) return
    setBusy(true)
    setError('')
    try {
      setValidation(await api.validate(spec))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function publishAgent() {
    if (!selected) return
    setBusy(true)
    setError('')
    try {
      if (selected.status === 'draft') {
        const spec = buildExpertSpec(form, {...selected, status: 'draft'})
        await api.updateAgent(selected.id, spec)
      }
      const published = await api.publish(selected.id)
      setSelected(published)
      setValidation(undefined)
      onOpenChat(published, false)
      closePanel()
      refresh()
    } catch (e) {
      const err = e as ApiError
      if (err.code === 'SPEC_INVALID') setError('La especificación no pasa validación. Revisa el panel de ciclo de vida.')
      else setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setBusy(true)
    setError('')
    try {
      await api.deleteAgent(deleteTarget.id)
      if (selected?.id === deleteTarget.id) closePanel()
      setDeleteTarget(null)
      refresh()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  function toggleTool(id: string) {
    setForm({...form, tools: toggleAgentTool(form.tools, id)})
  }

  return (
    <section className="agents-admin">
      <div className="section-head">
        <div>
          <span className="eyebrow">ADMINISTRACIÓN</span>
          <h2>Agentes registrados</h2>
          <p className="section-lead">Edita, valida, publica y ejecuta agentes desde un solo lugar.</p>
        </div>
        <button type="button" className="primary" onClick={onCreate}>
          <Plus size={17} /> Crear agente
        </button>
      </div>
      {error && !deleteTarget && (
        <div className="alert error">
          <AlertTriangle size={18} />
          <span>{error}</span>
          <button type="button" onClick={() => setError('')}>
            <X size={16} />
          </button>
        </div>
      )}
      <div className="agent-grid">
        {agents.map(a => (
          <div className={`agent-card ${a.status === 'published' ? 'is-published' : 'is-draft'}`} key={a.id}>
            <div className="agent-top">
              <div className="agent-icon"><Bot /></div>
              <Badge tone={a.status === 'published' ? 'success' : 'warning'}>{statusLabel(a.status)}</Badge>
            </div>
            <h3>{a.name}</h3>
            <p className="agent-purpose">{a.purpose}</p>
            <div className="chips">
              {a.tools.map(t => (
                <Badge key={t} tone={t === 'web_search' ? 'web' : 'neutral'}>{t}</Badge>
              ))}
            </div>
            <footer>
              <span>v{a.version}</span>
              <span>{a.model_id}</span>
              {a.permissions.includes('internet_access') && <Globe2 size={15} />}
            </footer>
            <div className="agent-actions agent-actions-grid">
              {a.status !== 'published' && (
                <>
                  <button type="button" className="secondary" onClick={() => onOpenChat(a, true)} disabled={busy}>
                    <FlaskConical size={14} /> Probar
                  </button>
                  <button type="button" className="primary" onClick={() => openPanel(a, 'lifecycle')} disabled={busy}>
                    <ShieldCheck size={14} /> Publicar
                  </button>
                </>
              )}
              {a.status === 'published' && (
                <button type="button" className="primary" onClick={() => onOpenChat(a, false)} disabled={busy}>
                  <Play size={14} /> Chatear
                </button>
              )}
              <button type="button" className="secondary" onClick={() => openPanel(a, 'edit')} disabled={busy}>
                <Pencil size={14} /> Editar
              </button>
              <button type="button" className="ghost danger-btn" onClick={() => setDeleteTarget(a)} disabled={busy}>
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <>
          <div className="drawer-backdrop" onClick={closePanel} aria-hidden />
          <aside className="drawer agent-editor drawer-wide">
            <header className="drawer-header">
              <div>
                <span className="eyebrow">GESTIÓN DE AGENTE</span>
                <h2>{selected.name}</h2>
                <div className="drawer-meta">
                  <Badge tone={selected.status === 'published' ? 'success' : 'warning'}>{statusLabel(selected.status)}</Badge>
                  <span>{selected.model_id}</span>
                  <span>v{selected.version}</span>
                </div>
              </div>
              <button type="button" className="close" onClick={closePanel} aria-label="Cerrar">
                <X />
              </button>
            </header>
            <nav className="drawer-tabs">
              <button type="button" className={tab === 'edit' ? 'active' : ''} onClick={() => setTab('edit')}>
                <Pencil size={15} /> Edición
              </button>
              <button type="button" className={tab === 'lifecycle' ? 'active' : ''} onClick={() => setTab('lifecycle')}>
                <ShieldCheck size={15} /> Validar y publicar
              </button>
            </nav>

            {tab === 'edit' && (
              <div className="drawer-body">
                <p className="editor-note">
                  Los cambios guardados devuelven el agente a <strong>borrador</strong>. Valida y vuelve a publicar para producción.
                </p>
                <ModelPicker models={models} value={form.model_id} onChange={id => setForm({...form, model_id: id})} />
                <div className="expert-form editor-form">
                  <label className="full">
                    Nombre
                    <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                  </label>
                  <label className="full">
                    Propósito
                    <textarea rows={3} value={form.purpose} onChange={e => setForm({...form, purpose: e.target.value})} />
                  </label>
                  <label>
                    Usuarios objetivo
                    <input value={form.target_users} onChange={e => setForm({...form, target_users: e.target.value})} />
                  </label>
                  <label>
                    Alcance
                    <input value={form.scope} onChange={e => setForm({...form, scope: e.target.value})} />
                  </label>
                  <label className="full">
                    Instrucciones
                    <textarea rows={5} value={form.instructions} onChange={e => setForm({...form, instructions: e.target.value})} />
                  </label>
                  <label className="full">
                    Resultado esperado
                    <textarea rows={2} value={form.expected_output} onChange={e => setForm({...form, expected_output: e.target.value})} />
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
                  {form.tools.includes('web_search') && (
                    <>
                      <label className="full">
                        Cuándo permitir web
                        <textarea rows={2} value={form.web_allowed_when} onChange={e => setForm({...form, web_allowed_when: e.target.value})} />
                      </label>
                      <label className="full">
                        Sin resultados web
                        <textarea rows={2} value={form.web_no_results} onChange={e => setForm({...form, web_no_results: e.target.value})} />
                      </label>
                    </>
                  )}
                  <label>
                    Restricciones
                    <textarea rows={2} value={form.constraints} onChange={e => setForm({...form, constraints: e.target.value})} />
                  </label>
                  <label>
                    Guardrails
                    <textarea rows={2} value={form.guardrails} onChange={e => setForm({...form, guardrails: e.target.value})} />
                  </label>
                  <label className="full">
                    Criterios de evaluación
                    <textarea rows={2} value={form.evaluation_criteria} onChange={e => setForm({...form, evaluation_criteria: e.target.value})} />
                  </label>
                </div>
                <div className="actions drawer-actions">
                  <button type="button" className="secondary" onClick={closePanel}>Cerrar</button>
                  <button type="button" className="primary" onClick={saveEdit} disabled={busy}>
                    {busy ? <Spinner /> : 'Guardar cambios'}
                  </button>
                </div>
              </div>
            )}

            {tab === 'lifecycle' && (
              <div className="drawer-body">
                <div className="lifecycle-steps">
                  <div className="lifecycle-step">
                    <span>1</span>
                    <div>
                      <strong>Validar especificación</strong>
                      <p>Comprueba modelo, herramientas, permisos y política web antes de publicar.</p>
                      <button type="button" className="secondary" onClick={validateAgent} disabled={busy}>
                        {busy ? <Spinner /> : <CheckCircle2 size={16} />}
                        Validar ahora
                      </button>
                    </div>
                  </div>
                  <div className="lifecycle-step">
                    <span>2</span>
                    <div>
                      <strong>Publicar agente</strong>
                      <p>Habilita ejecución operativa y aparece como publicado en el catálogo.</p>
                      <button
                        type="button"
                        className="primary"
                        onClick={publishAgent}
                        disabled={busy || (selected.status === 'draft' && validation?.status !== 'valid')}
                      >
                        {busy ? <Spinner /> : <ShieldCheck size={16} />}
                        Aprobar y publicar
                      </button>
                      {selected.status === 'draft' && validation?.status !== 'valid' && (
                        <small className="lifecycle-hint">Valida primero o corrige los errores mostrados abajo.</small>
                      )}
                    </div>
                  </div>
                  <div className="lifecycle-step">
                    <span>3</span>
                    <div>
                      <strong>Probar antes de publicar (opcional)</strong>
                      <p>Abre un chat de prueba con el borrador y mantén la conversación antes de publicar.</p>
                      <button type="button" className="ghost" onClick={() => { onOpenChat(selected, true); closePanel() }}>
                        Abrir chat de prueba <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
                {validation && (
                  <div className={`validation ${validation.status}`}>
                    <h3>
                      {validation.status === 'valid' ? <CheckCircle2 /> : <AlertTriangle />}
                      {validation.status === 'valid' ? 'Listo para publicar' : 'Requiere correcciones'}
                    </h3>
                    {validation.errors.map(x => (
                      <p className="v-error" key={x}>{x}</p>
                    ))}
                    {validation.warnings.map(x => (
                      <p className="v-warning" key={x}>{x}</p>
                    ))}
                    <small>{validation.passed.length} comprobaciones superadas</small>
                  </div>
                )}
              </div>
            )}

          </aside>
        </>
      )}

      {deleteTarget && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="confirm-dialog">
            <div className="confirm-icon danger">
              <Trash2 size={28} />
            </div>
            <h3>¿Eliminar este agente?</h3>
            <p>
              Se quitará <strong>{deleteTarget.name}</strong> del registro. Las trazas históricas pueden conservarse sin el
              agente asociado.
            </p>
            <p className="confirm-sub">Esta acción no se puede deshacer.</p>
            {error && deleteTarget && (
              <div className="alert error compact">
                <AlertTriangle size={16} />
                <span>{error}</span>
              </div>
            )}
            <div className="confirm-actions">
              <button type="button" className="secondary" onClick={() => { setDeleteTarget(null); setError('') }} disabled={busy}>
                Cancelar
              </button>
              <button type="button" className="primary danger-fill" onClick={confirmDelete} disabled={busy}>
                {busy ? <Spinner /> : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
