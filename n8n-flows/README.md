# Flujos n8n — HumaVE

Los 2 flujos están listos para importar: [`reporte_nocturno.json`](reporte_nocturno.json) y [`bot_stock_whatsapp.json`](bot_stock_whatsapp.json). En n8n: **Workflows → Import from File** (o copiar/pegar el JSON con Ctrl+V directo en el canvas).

## Flujo 1 — Reporte nocturno a Google Sheets

Según PRD sección 2.7. Cron diario 23:00 → `resumen_centros()` (Supabase) → formatea sin PII → Google Sheets (hojas "Resumen Diario" y "Aforo Actual").

**Antes de activar, reemplazar en el JSON o en el editor de n8n:**
1. `PEGAR_SERVICE_ROLE_KEY_AQUI` (2 veces, nodo "Consultar resumen_centros") → Service Role Key del proyecto (Supabase Dashboard → Settings → API → `service_role`, **no** la `anon`/`publishable`).
2. `PEGAR_ID_DEL_GOOGLE_SHEET_AQUI` (3 veces) → ID del Google Sheet (de la URL: `docs.google.com/spreadsheets/d/`**`ESTE_ID`**`/edit`).
3. Crear la credencial **Google Sheets - HumaVE** (OAuth2) en n8n y asignarla a los 3 nodos de Google Sheets.
4. Las hojas "Resumen Diario" y "Aforo Actual" deben existir ya en el Sheet, con encabezados: `Fecha | Centro | Tipo | Municipio | Aforo Actual | Capacidad | % Ocupacion | Personas Hoy | Items Bajo Stock | Movimientos del Dia`.

La función SQL `resumen_centros()` está en [`supabase/migrations/001_initial.sql`](../supabase/migrations/001_initial.sql).

## Flujo 2 — Bot de stock por WhatsApp (bidireccional)

**Nota:** ya existe una versión simplificada funcionando — un bot de consulta de stock dentro de la propia PWA (texto libre, sin Twilio), ver [`app/src/Bot.jsx`](../app/src/Bot.jsx). Este flujo de n8n es la extensión a WhatsApp, reusando la misma lógica de parseo.

**Por qué Twilio y no CallMeBot:** CallMeBot (la opción gratuita del PRD original) es solo *outbound* — no puede recibir mensajes. El pedido fue un bot bidireccional (alertas push + consultas pull), así que se necesita un proveedor con webhooks de mensajes entrantes.

**Setup pendiente (cuenta propia, no se puede automatizar):**
1. Crear cuenta en [twilio.com](https://www.twilio.com) y activar el sandbox de WhatsApp.
2. Obtener `Account SID` y `Auth Token` (Twilio Console → Account Info).
3. Crear la credencial **Twilio - HumaVE** en n8n: tipo "Basic Auth", usuario = Account SID, contraseña = Auth Token.

**Antes de activar, reemplazar en el JSON o en el editor de n8n:**
1. `PEGAR_SERVICE_ROLE_KEY_AQUI` (4 veces) → Service Role Key del proyecto.
2. `PEGAR_TWILIO_ACCOUNT_SID` (2 veces, en la URL de los nodos HTTP a Twilio) → tu Account SID.
3. `PEGAR_NUMERO_CENTRAL_AQUI` (nodo "Enviar alerta WhatsApp") → número de WhatsApp que recibe las alertas push, formato `+584121234567`.
4. El nodo "Webhook mensaje entrante" genera una URL al activar el flujo (Production URL) — copiarla y pegarla en Twilio Console → Sandbox Settings → "WHEN A MESSAGE COMES IN".
5. `From: whatsapp:+14155238886` es el número de sandbox de Twilio — cambiarlo cuando haya un número de WhatsApp Business propio aprobado.

**Cómo funciona:**
- **Sub-flujo push** (Cron cada 4h): consulta `items_bajo_stock()` → si hay algo bajo mínimo, manda un mensaje consolidado al número central.
- **Sub-flujo pull** (Webhook): recibe el mensaje entrante de Twilio, busca el centro por nombre (substring simple, ej. "stock de Refugio Petare" → busca "Refugio Petare"), consulta su inventario y responde por WhatsApp. Si no encuentra el centro, responde con ayuda.

La función SQL `items_bajo_stock()` está en `supabase/migrations/010_add_items_bajo_stock_rpc.sql`.

**Costo:** sandbox es gratis para probar. Producción requiere número de WhatsApp Business aprobado por Meta (vía Twilio) — esto saca el costo de WhatsApp del rango "$0/mes" original del PRD. Confirmar presupuesto antes de pasar de sandbox a producción.

## Flujo 3 — Acta de envío (no usa n8n)

Ya implementado en la app (no requiere n8n). La PWA llama directo a la Edge Function `generar_acta_envio` → recibe el texto del acta → genera un link `wa.me` para compartir en 1 tap. Ver [`app/src/Envios.jsx`](../app/src/Envios.jsx) y [`supabase/functions/generar_acta_envio/`](../supabase/functions/generar_acta_envio/).
