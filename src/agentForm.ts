import type {AgentSpec} from './types'



export type ExpertDraft = {

  name: string

  purpose: string

  target_users: string

  scope: string

  input_description: string

  expected_output: string

  instructions: string

  model_id: string

  tools: string[]

  constraints: string

  guardrails: string

  evaluation_criteria: string

  web_allowed_when: string

  web_no_results: string

  human_approval: boolean

}



const DEFAULT_WEB_WHEN = 'evidencia local insuficiente\ninformación reciente o de mercado'

const DEFAULT_WEB_NO_RESULTS =

  'Informar que no se encontraron fuentes confiables y sugerir reformular la consulta.'



export const defaultExpertDraft: ExpertDraft = {

  name: 'Agente personalizado Bia',

  purpose: 'Asistir al equipo con una tarea especializada definida por el usuario, con respuestas trazables.',

  target_users: 'Equipos internos de Bia Energy',

  scope: 'Información pública y documentación interna permitida por la especificación',

  input_description: 'Consultas en lenguaje natural alineadas con el propósito del agente',

  expected_output: 'Respuesta estructurada con hechos, inferencias y fuentes citadas cuando aplique',

  instructions:

    'Sigue el propósito y las restricciones de tu especificación. Distingue hechos de inferencias. Si la evidencia es insuficiente, dilo claramente.',

  model_id: 'groq-default',

  tools: ['architecture_knowledge'],

  constraints: 'No exponer secretos\nRespetar permisos y herramientas habilitadas',

  guardrails: 'No inventar datos\nCitar fuentes cuando uses conocimiento o web',

  evaluation_criteria: 'Relevancia\nTrazabilidad de fuentes',

  web_allowed_when: DEFAULT_WEB_WHEN,

  web_no_results: DEFAULT_WEB_NO_RESULTS,

  human_approval: false,

}

/** Formulario en blanco para modo live (sin plantilla demo precargada). */
export function emptyExpertDraft(modelId = 'groq-default'): ExpertDraft {
  return {
    name: '',
    purpose: '',
    target_users: '',
    scope: '',
    input_description: '',
    expected_output: '',
    instructions: '',
    model_id: modelId,
    tools: [],
    constraints: '',
    guardrails: '',
    evaluation_criteria: '',
    web_allowed_when: '',
    web_no_results: '',
    human_approval: false,
  }
}

/** Plantillas solo para modo demo / guión de demostración */

export const demoBuilderTemplates: {

  id: string

  label: string

  description: string

  guidedInput: string

  expertDraft: ExpertDraft

}[] = [

  {

    id: 'commercial',

    label: 'Investigador Comercial Energético',

    description: 'Investiga empresas del sector con RAG local y web controlada (dato demo).',

    guidedInput:

      'Quiero un agente que investigue empresas del sector energético con evidencia local y pública actualizada.',

    expertDraft: {

      ...defaultExpertDraft,

      name: 'Investigador Comercial Energético',

      purpose:

        'Investigar empresas del sector energético con evidencia local y pública actualizada.',

      target_users: 'Equipo comercial',

      scope: 'Información pública no sensible',

      input_description: 'Empresa o tema a investigar',

      expected_output: 'Reporte comercial con hechos, inferencias y fuentes.',

      instructions:

        'Consulta conocimiento local primero. Cita fuentes y distingue hechos de inferencias. Usa web solo si la política lo permite.',

      tools: ['company_research', 'web_search'],

      constraints: 'No inventar información\nMáximo una búsqueda web por ejecución',

      guardrails: 'No exponer secretos\nMarcar contenido demo como tal',

      evaluation_criteria: 'Exactitud\nFuentes trazables',

    },

  },

  {

    id: 'architecture',

    label: 'Consultor de Arquitectura',

    description: 'Responde sobre arquitectura de la plataforma usando solo conocimiento local.',

    guidedInput: 'Necesito un agente que explique arquitectura, registros y procedimientos de la plataforma Bia.',

    expertDraft: {

      ...defaultExpertDraft,

      name: 'Consultor de Arquitectura',

      purpose: 'Responder consultas sobre arquitectura y gobernanza de la plataforma de agentes.',

      target_users: 'Equipos técnicos y arquitectura',

      scope: 'Documentación interna demo de arquitectura',

      tools: ['architecture_knowledge'],

      instructions: 'Usa solo el conocimiento local. No uses internet. Cita fragmentos recuperados.',

    },

  },

]

export function expertDraftForBuilderMode(
  mode: 'demo' | 'live',
  modelId: string,
  templateId?: string,
): ExpertDraft {
  if (mode === 'live') return emptyExpertDraft(modelId)
  const template = demoBuilderTemplates.find(t => t.id === templateId) ?? demoBuilderTemplates[0]
  return {...template.expertDraft, model_id: modelId}
}

export function toggleAgentTool(tools: string[], id: string): string[] {

  return tools.includes(id) ? tools.filter(t => t !== id) : [...tools, id]

}



function lines(s: string) {

  return s.split('\n').map(x => x.trim()).filter(Boolean)

}



function knowledgeSourcesForTools(tools: string[]): string[] {

  const sources: string[] = []

  if (tools.includes('company_research')) {

    sources.push('Knowledge local / RAG demo', 'Documentos corporativos Bia (demo)')

  } else if (tools.includes('architecture_knowledge')) {

    sources.push('Knowledge local / RAG demo')

  }

  if (tools.includes('web_search')) {

    sources.push('Fuentes web públicas (Tavily)')

  }

  return sources.length ? sources : ['Conocimiento del modelo (sin RAG local)']

}



export function buildExpertSpec(form: ExpertDraft, existing?: AgentSpec): AgentSpec {

  const web = form.tools.includes('web_search')

  const criteria = lines(form.evaluation_criteria)

  const constraints = lines(form.constraints)

  const guardrails = lines(form.guardrails)

  const allowedWhen = lines(form.web_allowed_when)

  const now = new Date().toISOString()

  return {

    id: existing?.id ?? crypto.randomUUID(),

    name: form.name,

    version: existing?.version ?? '1.0.0',

    status: existing?.status ?? 'draft',

    purpose: form.purpose,

    target_users: form.target_users || undefined,

    scope: form.scope || undefined,

    input_description: form.input_description || undefined,

    expected_output: form.expected_output,

    instructions: form.instructions,

    model_id: form.model_id,

    tools: form.tools.length ? form.tools : ['architecture_knowledge'],

    knowledge_sources: knowledgeSourcesForTools(form.tools),

    permissions: web ? ['internet_access'] : [],

    constraints: constraints.length ? constraints : ['Respetar permisos y herramientas habilitadas'],

    guardrails: guardrails.length ? guardrails : ['No inventar datos'],

    human_approval: form.human_approval,

    evaluation_criteria: criteria.length ? criteria : ['Relevancia'],

    web_search_policy: web

      ? {

          allowed_when: allowedWhen.length ? allowedWhen : lines(DEFAULT_WEB_WHEN),

          requires_human_approval: form.human_approval,

          source_types_allowed: ['official', 'reputable_media'],

          citation_required: true,

          no_results_behavior: form.web_no_results.trim() || DEFAULT_WEB_NO_RESULTS,

        }

      : undefined,

    created_at: existing?.created_at ?? now,

    updated_at: now,

  }

}



export function agentToExpertDraft(agent: AgentSpec): ExpertDraft {

  const policy = agent.web_search_policy as {allowed_when?: string[]; no_results_behavior?: string} | undefined

  return {

    name: agent.name,

    purpose: agent.purpose,

    target_users: agent.target_users ?? '',

    scope: agent.scope ?? '',

    input_description: agent.input_description ?? '',

    expected_output: agent.expected_output,

    instructions: agent.instructions,

    model_id: agent.model_id,

    tools: [...agent.tools],

    constraints: agent.constraints.join('\n'),

    guardrails: agent.guardrails.join('\n'),

    evaluation_criteria: agent.evaluation_criteria.join('\n'),

    web_allowed_when: policy?.allowed_when?.join('\n') ?? DEFAULT_WEB_WHEN,

    web_no_results: policy?.no_results_behavior ?? DEFAULT_WEB_NO_RESULTS,

    human_approval: agent.human_approval,

  }

}


