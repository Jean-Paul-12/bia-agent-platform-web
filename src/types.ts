export type View='dashboard'|'builder'|'agents'|'traces'|'agent-chat'
export interface ChatTurn{role:'user'|'assistant';content:string}
export type Status='draft'|'validated'|'published'
export interface AgentSpec{ id:string;name:string;version:string;status:Status;purpose:string;target_users?:string;scope?:string;input_description?:string;expected_output:string;instructions:string;model_id:string;tools:string[];knowledge_sources:string[];permissions:string[];constraints:string[];guardrails:string[];human_approval:boolean;evaluation_criteria:string[];web_search_policy?:object;created_at:string;updated_at:string}
export interface CatalogModel{id:string;description:string;ui_label?:string;ui_hint?:string;coming_soon?:boolean;active?:boolean;selectable?:boolean}
export interface BuilderSession{session_id:string;state:string;messages:{role:string;content:string}[];collected_fields:Record<string,unknown>;pending_fields:string[];progress:number;draft_spec?:AgentSpec;current_question?:{key:string;question:string;hint:string;default:string};name_suggestions?:string[];name_suggestions_source?:'llm'|'rules'}
export interface Validation{status:'valid'|'invalid';errors:string[];warnings:string[];passed:string[]}
export interface Source{type:'local'|'web'|'demo';title:string;url?:string;snippet:string;score?:number;provider:string}
export interface RunResult{output:string;knowledge_source:string;sources:Source[];model_used?:string;latency_ms:number;trace_id:string;demo_mode:boolean;draft_run?:boolean}
export interface Trace{trace_id:string;agent_id:string;agent_name?:string;timestamp:string;status:string;model_used?:string;total_latency_ms:number;tokens_total?:number;knowledge_source:string;tools_used:string[];steps?:{name:string;status:string;detail?:string}[];input?:string;output?:string;web_search_decision_reason?:string;tavily_sources?:Source[]}
export interface Health{backend:string;itsfree_configured:boolean;llm_provider_catalog?:string;itsfree_base_url?:string;tavily_configured:boolean;database_available:boolean;mode:string}
