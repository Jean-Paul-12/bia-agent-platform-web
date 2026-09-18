import {useEffect,useState} from 'react'
import {Activity,Blocks,Bot,ChevronRight,Database,Home,Plus,ShieldCheck,Sparkles,WifiOff,X,AlertTriangle} from 'lucide-react'
import type {LucideIcon} from 'lucide-react'
import {api} from './api'
import type {AgentSpec,Health,Trace,View} from './types'
import {AgentChatView} from './AgentChatView'
import {AgentsAdmin} from './AgentsAdmin'
import {VoltForgeBuilder, AGENT_BUILDER_VIEW} from './VoltForgeBuilder'

const nav:[View,string,typeof Home][]=[['dashboard','Resumen',Home],['builder',AGENT_BUILDER_VIEW,Sparkles],['agents','Agentes',Bot],['traces','Trazas',Activity]]
const viewTitles:Partial<Record<View,string>>={ 'agent-chat':'Chat con agente' }
const Badge=({children,tone='neutral'}:{children:React.ReactNode;tone?:string})=><span className={`badge ${tone}`}>{children}</span>
const Spinner=()=> <span className="spinner"/>
const Empty=({text}:{text:string})=><div className="empty"><Blocks size={32}/><p>{text}</p></div>
const ErrorBox=({error,onClose}:{error:string;onClose?:()=>void})=><div className="alert error"><AlertTriangle size={18}/><span>{error}</span>{onClose&&<button onClick={onClose}><X size={16}/></button>}</div>

function Sidebar({view,setView}:{view:View;setView:(v:View)=>void}){
 return <aside className="sidebar"><div className="brand"><div className="brandmark">B</div><div><strong>Bia</strong><small>Agent Platform</small></div></div>
 <nav>{nav.map(([id,label,Icon])=><button className={view===id?'active':''} onClick={()=>setView(id)} key={id}><Icon size={19}/>{label}</button>)}</nav>
 <div className="sidefoot"><span className="pulse"/><div><strong>Demo técnica</strong><small>Entorno local</small></div></div></aside>
}

function Header({view,health,subtitle}:{view:View;health?:Health;subtitle?:string}){
 const title=viewTitles[view]??nav.find(n=>n[0]===view)?.[1]
 return <header><div><span className="eyebrow">BIA AGENT PLATFORM</span><h1>{title}</h1>{subtitle&&<p className="header-sub">{subtitle}</p>}</div>
 <div className="health">{health?<><span className={`dot ${health.backend==='available'?'ok':'bad'}`}/><span>Backend conectado</span><Badge tone={health.mode==='demo'?'warning':'success'}>{health.mode==='demo'?'Modo demo':'Modo live'}</Badge></>:<><WifiOff size={16}/> Sin conexión</>}</div></header>
}

function Dashboard({agents,traces,setView}:{agents:AgentSpec[];traces:Trace[];setView:(v:View)=>void}){
 const published=agents.filter(a=>a.status==='published').length, local=traces.filter(t=>t.knowledge_source==='local').length
 const cards:Array<[string,string|number,LucideIcon]>=[['Agentes',agents.length,Bot],['Publicados',published,ShieldCheck],['Ejecuciones',traces.length,Activity],['Uso RAG local',traces.length?`${Math.round(local/traces.length*100)}%`:'—',Database]]
 return <><div className="hero"><div><Badge tone="demo">Datos demo</Badge><h2>Gobierna agentes. No solo prompts.</h2><p>Crea, valida, publica y observa agentes con un contrato común y fuentes trazables.</p><button className="primary" onClick={()=>setView('builder')}><Plus size={17}/>Crear agente</button></div><div className="orb"><Sparkles/></div></div>
 <div className="stats">{cards.map(([label,value,Icon])=><div className="stat" key={String(label)}><div className="stat-icon"><Icon size={20}/></div><span>{label as string}</span><strong>{value as string|number}</strong></div>)}</div>
 <section><div className="section-head"><div><span className="eyebrow">ACTIVIDAD</span><h2>Últimas ejecuciones</h2></div><button className="ghost" onClick={()=>setView('traces')}>Ver todas <ChevronRight size={16}/></button></div>
 {traces.length?<div className="table dashboard-traces">{traces.slice(0,5).map(t=><div className="row" key={t.trace_id}><div className="trace-id"><Activity size={16}/><span>{t.agent_name||agents.find(a=>a.id===t.agent_id)?.name||'Agente'}</span></div><Badge tone={t.knowledge_source==='local'?'local':'web'}>{t.knowledge_source}</Badge><span>{t.model_used||'No disponible'}</span><span>{t.total_latency_ms} ms</span><Badge tone="success">{t.status}</Badge></div>)}</div>:<Empty text="Aún no hay ejecuciones. Ejecuta un agente para generar una traza."/>}</section></>
}

function TracesView({traces,selected,setSelected}:{traces:Trace[];selected?:Trace;setSelected:(t?:Trace)=>void}){
 return <div className="trace-layout"><section><div className="section-head"><div><span className="eyebrow">OBSERVABILIDAD</span><h2>Ejecuciones</h2></div><Badge tone="demo">Métricas disponibles</Badge></div>{traces.length?<div className="table traces">{traces.map(t=><button className="row" key={t.trace_id} onClick={async()=>setSelected(await api.trace(t.trace_id))}><span className="trace-id"><Activity size={16}/>{t.agent_name||t.agent_id.slice(0,8)}</span><Badge tone={t.knowledge_source==='local'?'local':'web'}>{t.knowledge_source}</Badge><span>{t.total_latency_ms} ms</span><span>{t.tokens_total??'No disponible'}</span><ChevronRight size={15}/></button>)}</div>:<Empty text="No hay trazas todavía."/>}</section>
 {selected&&<aside className="drawer"><button className="close" onClick={()=>setSelected(undefined)}><X/></button><span className="eyebrow">TRACE DETAIL</span><h2>{selected.agent_name||'Traza'}</h2><p className="trace-subid">{selected.trace_id.slice(0,12)}</p><div className="trace-meta"><Badge tone={selected.status==='success'?'success':'error'}>{selected.status}</Badge><span>{selected.model_used||'Modelo no disponible'}</span><span>{selected.total_latency_ms} ms</span></div><h3>Secuencia</h3><div className="timeline">{selected.steps?.map((s,i)=><div className="step" key={i}><span>{i+1}</span><div><strong>{s.name}</strong>{s.detail&&<p>{s.detail}</p>}</div></div>)}</div>{selected.input&&<><h3>Entrada</h3><p className="trace-text">{selected.input}</p></>}{selected.web_search_decision_reason&&<><h3>Decisión web</h3><p className="trace-text">{selected.web_search_decision_reason}</p></>}</aside>}</div>
}

export default function App(){
 const [view,setView]=useState<View>('dashboard'),[health,setHealth]=useState<Health>(),[agents,setAgents]=useState<AgentSpec[]>([]),[traces,setTraces]=useState<Trace[]>([]),[selected,setSelected]=useState<Trace>(),[offline,setOffline]=useState(false)
 const [chatSession,setChatSession]=useState<{agentId:string;allowDraft:boolean}|null>(null)
 const load=()=>{api.health().then(h=>{setHealth(h);setOffline(false)}).catch(()=>setOffline(true));api.agents().then(setAgents).catch(()=>{});api.traces().then(setTraces).catch(()=>{})}
 useEffect(load,[])
 async function openTrace(id:string){setSelected(await api.trace(id));setView('traces')}
 function openAgentChat(agent:AgentSpec,allowDraft:boolean){setChatSession({agentId:agent.id,allowDraft});setView('agent-chat')}
 const chatAgent=chatSession?agents.find(a=>a.id===chatSession.agentId):undefined
 function leaveChat(){setChatSession(null);setView('agents')}
 return <div className="app"><Sidebar view={view==='agent-chat'?'agents':view} setView={v=>{setChatSession(null);setView(v)}}/><main><Header view={view} health={health} subtitle={view==='agent-chat'?chatAgent?.name:undefined}/>{offline&&<ErrorBox error="Backend desconectado. Inicia FastAPI en http://localhost:8000 y recarga la página."/>}<div className="content">{view==='dashboard'&&<Dashboard agents={agents} traces={traces} setView={setView}/>} {view==='builder'&&<VoltForgeBuilder refresh={load} onTrace={openTrace} onOpenAgentChat={openAgentChat}/>} {view==='agents'&&<AgentsAdmin agents={agents} refresh={load} onCreate={()=>setView('builder')} onOpenChat={openAgentChat}/>} {view==='agent-chat'&&chatAgent&&chatSession&&<AgentChatView agent={chatAgent} allowDraft={chatSession.allowDraft} onBack={leaveChat} onTrace={openTrace}/>} {view==='agent-chat'&&!chatAgent&&<Empty text="Agente no encontrado. Vuelve al listado."/>} {view==='traces'&&<TracesView traces={traces} selected={selected} setSelected={setSelected}/>}</div></main></div>
}
