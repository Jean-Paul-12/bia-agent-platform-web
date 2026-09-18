# Bia Agent Platform — Web

Interfaz para Agent Builder (Volt Forge), administración de agentes, chat y trazas.

## Stack (frontend)

- **UI:** React 18, TypeScript, Vite  
- **Estilo:** CSS propio (tema oscuro Bia Energy), sin UI kit pesado  
- **Iconos:** Lucide React  
- **Cliente API:** `fetch` + tipos compartidos (`src/api.ts`, `src/types.ts`)  
- **Vistas:** Dashboard, Agent Builder (guiado / experto), Agentes (CRUD, publicar, chat), Trazas  
- **Config:** variables `VITE_*` (p. ej. `VITE_API_URL` hacia la API en Render o local)

## Local

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

- UI: http://localhost:5173  
- Backend: `VITE_API_URL=http://localhost:8000/api` (en `.env`).

## Demo y límites

- La UI muestra **modo demo** o **live** según el backend.
- Parte del contenido (documentos RAG, plantillas, seeds) es **dato de prueba inventado**; en **live** el agente responde con **Groq (gratuito)** y **Tavily (gratuito)** → pueden fallar o agotar cuota en picos de uso.
- No es un entorno de producción ni SLA.

## Vercel

1. Importar repo [bia-agent-platform-web](https://github.com/Jean-Paul-12/bia-agent-platform-web).
2. Framework: Vite · Build: `npm run build` · Output: `dist`
3. Variable (**obligatoria**, se embebe en el build):  
   `VITE_API_URL=https://bia-agent-platform-api.onrender.com/api`  
   Debe terminar en **`/api`**. Sin esta variable, el front apunta a `localhost`.
4. Tras el deploy, actualizar `FRONTEND_ORIGIN` en Render con la URL de Vercel.

## Build

```powershell
npm run build
```
