# Flujos n8n — HumanVe

## Flujo 1 — Reporte nocturno a Google Sheets

Según PRD sección 2.7. Cron diario 23:00 → `resumen_centros()` (Supabase) → formatea sin PII → Google Sheets (hojas "Resumen Diario" y "Aforo Actual"). JSON listo para importar: [`reporte_nocturno.json`](reporte_nocturno.json).

**Antes de activar, reemplazar:**
1. `PEGAR_SERVICE_ROLE_KEY_AQUI` (2 veces, nodo "Consultar resumen_centros") → Service Role Key del proyecto (Supabase Dashboard → Settings → API → `service_role`, **no** la `anon`/`publishable`).
2. `PEGAR_ID_DEL_GOOGLE_SHEET_AQUI` (3 veces) → ID del Google Sheet (de la URL: `docs.google.com/spreadsheets/d/`**`ESTE_ID`**`/edit`).
3. Crear la credencial **Google Sheets - HumanVe** (OAuth2) en n8n y asignarla a los 3 nodos de Google Sheets.
4. Las hojas "Resumen Diario" y "Aforo Actual" deben existir ya en el Sheet, con encabezados: `Fecha | Centro | Tipo | Municipio | Aforo Actual | Capacidad | % Ocupacion | Personas Hoy | Items Bajo Stock | Movimientos del Dia`.

La función SQL `resumen_centros()` está en [`supabase/migrations/001_initial.sql`](../supabase/migrations/001_initial.sql).

## Bot de stock — decisión final: web, no WhatsApp/Twilio

**Se descartó el bot de WhatsApp vía Twilio.** Decisión del usuario: simplificar y manejar todo desde la web, sin depender de una cuenta de Twilio ni de la aprobación de Meta para producción.

En su lugar hay **dos bots web**, ambos en la PWA (no requieren n8n):
- [`app/src/Bot.jsx`](../app/src/Bot.jsx) — para staff logueado (voluntario/operador/coordinador), usa RLS normal.
- [`app/src/PublicBot.jsx`](../app/src/PublicBot.jsx) — público, **sin login**, en la ruta `/bot-publico`. Cualquiera con el link puede preguntar "stock de \<centro\>" o "centros".

El acceso público no abre las tablas reales por RLS — usa dos funciones `SECURITY DEFINER` acotadas a propósito (`listar_centros_publico()`, `consultar_stock_publico()` en [`supabase/migrations/011_add_public_stock_consulta_rpcs.sql`](../supabase/migrations/011_add_public_stock_consulta_rpcs.sql)) que **solo** devuelven nombre de centro + stock de items. Nunca personas, fotos, aforo ni desaparecidos.

## Flujo 2 — Acta de envío (no usa n8n)

Ya implementado en la app. La PWA llama directo a la Edge Function `generar_acta_envio` → recibe el texto del acta → genera un link `wa.me` para compartir en 1 tap. Ver [`app/src/Envios.jsx`](../app/src/Envios.jsx) y [`supabase/functions/generar_acta_envio/`](../supabase/functions/generar_acta_envio/).
