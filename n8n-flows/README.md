# Flujos n8n — HumaVE

> Estado: pendiente de construir los JSON de importación. Esta nota documenta las decisiones tomadas para que quien construya los flujos no tenga que re-derivarlas.

## Flujo 1 — Reporte nocturno a Google Sheets

Según PRD sección 2.7. Cron diario 23:00 → `GET /rest/v1/rpc/resumen_centros` (Supabase) → formatea sin PII → Google Sheets (hojas "Resumen Diario" y "Aforo Actual").

La función SQL `resumen_centros()` ya está en [`supabase/migrations/001_initial.sql`](../supabase/migrations/001_initial.sql).

## Flujo 2 — Bot de stock por WhatsApp (bidireccional)

**Estado: pausado.** Se implementó primero la versión simplificada — un bot de consulta de stock dentro de la propia PWA (texto libre, sin Twilio/WhatsApp), ver [`app/src/Bot.jsx`](../app/src/Bot.jsx). Consulta directo a Supabase (RLS ya filtra por centro/rol del usuario logueado). El bot de WhatsApp queda para una segunda etapa, reusando la misma lógica de parseo cuando haya cuenta de Twilio.

**Decisión (no estaba en el PRD original):** el coordinador quiere un número central de WhatsApp donde se pueda:
1. Recibir alertas automáticas de stock crítico (push, cron periódico).
2. Escribirle al bot y preguntar el stock de un centro (pull, bajo demanda).

**Por qué no CallMeBot:** CallMeBot (la opción gratuita que sugiere el PRD) es solo *outbound* — no puede recibir mensajes. Un bot que responde preguntas necesita un proveedor que soporte webhooks de mensajes entrantes.

**Decisión: Twilio WhatsApp API.**
- Sandbox de Twilio: gratis para desarrollo/testing, sin aprobación de Meta.
- Producción: requiere número de WhatsApp Business aprobado por Meta (vía Twilio, más simple que ir directo a Meta, pero no instantáneo — puede tardar días).
- Esto saca el costo de WhatsApp del rango "$0/mes" original del PRD una vez en producción (cobra por mensaje). Hay que confirmar presupuesto antes de pasar de sandbox a producción.

**Setup pendiente (requiere cuenta propia del usuario, no se puede automatizar):**
1. Crear cuenta en [twilio.com](https://www.twilio.com) y activar el sandbox de WhatsApp.
2. Obtener `Account SID` y `Auth Token`.
3. En el n8n del VPS existente, agregar credencial de Twilio.
4. Configurar en la consola de Twilio el webhook de mensajes entrantes apuntando a la URL pública del workflow n8n (vía Traefik).

**Diseño del workflow (a construir cuando haya credenciales):**
- **Sub-flujo push:** Cron (cada N horas) → `resumen_centros()` o query directa a `items_inventario` donde `stock_actual < stock_minimo` → agrupa por centro → manda un mensaje consolidado al número central vía Twilio.
- **Sub-flujo pull:** Webhook (mensaje entrante de Twilio) → parsea texto (ej. `"stock <nombre_centro>"`) → busca el centro por nombre → consulta `items_inventario` de ese centro → responde con el resultado vía Twilio API.

## Flujo 3 — Acta de envío (no usa n8n)

Confirmado en PRD 2.7: la app llama directo a la Edge Function `generar_acta_envio` → recibe el texto → abre `whatsapp://send?text=...` en el celular. No requiere n8n ni credenciales adicionales.
