-- Funcion de soporte para el flujo n8n de alertas de stock por WhatsApp
-- (ver n8n-flows/bot_stock_whatsapp.json). Devuelve los items por debajo
-- del minimo, con nombre de centro, listos para formatear en un mensaje.
-- Pensada para llamarse con la Service Role Key (bypasea RLS) desde
-- n8n -- no es para uso directo de la app.

create or replace function public.items_bajo_stock()
returns table(centro text, item text, stock_actual int, stock_minimo int, unidad text)
language sql stable
set search_path = public, extensions
as $$
  select c.nombre, i.nombre, i.stock_actual, i.stock_minimo, i.unidad
  from items_inventario i
  join centros c on c.id = i.centro_id
  where i.stock_actual < i.stock_minimo
  order by c.nombre, i.nombre;
$$;
