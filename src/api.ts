import type {AgentSpec,BuilderSession,CatalogModel,ChatTurn,Health,RunResult,Trace,Validation} from './types'

/** URL base de la API; en Vercel debe ser `https://<tu-api>.onrender.com/api` (con `/api`). */
export function resolveApiBase(): string {
  const raw = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').trim().replace(/\/$/, '')
  if (raw.endsWith('/api')) return raw
  return `${raw}/api`
}

const BASE = resolveApiBase()
export class ApiError extends Error{constructor(message:string,public code='API_ERROR'){super(message)}}
async function request<T>(path:string,options?:RequestInit):Promise<T>{
  let response:Response
  try{response=await fetch(BASE+path,{...options,headers:{'Content-Type':'application/json',...options?.headers}})}
  catch{throw new ApiError('No se pudo conectar con el backend. Verifica que FastAPI esté iniciado.','BACKEND_OFFLINE')}
  if(response.status===204)return undefined as T
  const data=await response.json().catch(()=>({}))
  if(!response.ok)throw new ApiError(data.message||'La solicitud no pudo completarse.',data.code)
  return data as T
}
export const api={
 health:()=>request<Health>('/health'),
 models:()=>request<CatalogModel[]>('/models'),
 tools:()=>request<{id:string;description:string}[]>('/tools'),
 agents:()=>request<AgentSpec[]>('/agents'),
 createAgent:(s:AgentSpec)=>request<AgentSpec>('/agents',{method:'POST',body:JSON.stringify(s)}),
 updateAgent:(id:string,s:AgentSpec)=>request<AgentSpec>(`/agents/${id}`,{method:'PUT',body:JSON.stringify(s)}),
 deleteAgent:(id:string)=>request<void>(`/agents/${id}`,{method:'DELETE'}),
 validate:(s:AgentSpec)=>request<Validation>('/agents/validate',{method:'POST',body:JSON.stringify(s)}),
 publish:(id:string)=>request<AgentSpec>(`/agents/${id}/publish`,{method:'POST'}),
 run:(id:string,input:string,opts?:{force_web_search?:boolean;allow_draft?:boolean;history?:ChatTurn[]})=>request<RunResult>(`/agents/${id}/run`,{method:'POST',body:JSON.stringify({input,allow_web_search:true,force_web_search:opts?.force_web_search??false,allow_draft:opts?.allow_draft??false,history:opts?.history??[]})}),
 createSession:(user_input:string,model_id='groq-default')=>request<BuilderSession>('/builder/sessions',{method:'POST',body:JSON.stringify({user_input,model_id})}),
 message:(id:string,user_input:string)=>request<BuilderSession>(`/builder/sessions/${id}/messages`,{method:'POST',body:JSON.stringify({user_input})}),
 traces:()=>request<Trace[]>('/traces'),
 trace:(id:string)=>request<Trace>(`/traces/${id}`)
}
