# HumanVe

Sistema Nacional de Respuesta Humanitaria — Venezuela.

PWA offline-first para gestión humanitaria, operable desde teléfonos Android con conectividad intermitente. Cubre registro de personas desaparecidas, control de inventario en centros de acopio, monitoreo de aforo en refugios/hospitales/clínicas, y seguimiento logístico de envíos entre centros.

## Stack

- **App**: PWA — React + Vite + Tailwind v4 + Workbox (`/app`)
- **Backend**: Supabase — Postgres + Auth + Storage, RLS por rol y centro (`/supabase`)
- **Automatización**: n8n — reporte nocturno a Sheets, bot de stock por WhatsApp (`/n8n-flows`)
- **Hosting**: Vercel
- **Reportes**: Google Sheets + Drive

## Estructura

```
/app             PWA React + Vite
/supabase        Migraciones SQL (schema, RLS, triggers, funciones)
/n8n-flows       Flujos de automatización (diseño + JSON de importación)
/docs            PRD + SDD original
```

## Desarrollo local

```bash
cd app
npm install
cp .env.example .env   # completar con tus credenciales de Supabase
npm run dev
```

## Documentación

Ver [`docs/HumanVe_PRD_SDD_v1.0.docx`](docs/HumanVe_PRD_SDD_v1.0.docx) para el PRD + SDD completo.
