# Bia Agent Platform — Web

React + Vite + TypeScript. Agent Builder (Volt Forge), agentes, chat y trazas.

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
3. Variable: `VITE_API_URL=https://<tu-api-en-render>.onrender.com/api`
4. Tras el deploy, actualizar `FRONTEND_ORIGIN` en Render con la URL de Vercel.

## Build

```powershell
npm run build
```
