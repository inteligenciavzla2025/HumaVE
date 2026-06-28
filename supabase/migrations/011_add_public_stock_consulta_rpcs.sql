-- RPCs publicas (sin login) para el bot web de consulta de stock
-- (app/src/PublicBot.jsx, ruta /bot-publico).
--
-- Decision: el usuario descarto el bot de WhatsApp via Twilio y pidio
-- manejar todo desde la web, accesible sin cuenta. En vez de abrir las
-- politicas RLS de items_inventario/centros a anon (lo que arriesgaria
-- exponer mas de la cuenta si esas tablas ganan columnas sensibles a
-- futuro), se crean funciones SECURITY DEFINER bien acotadas que SOLO
-- devuelven nombre de centro + stock de items. Nunca tocan personas,
-- aforo_registros ni desaparecidos.

create or replace function public.listar_centros_publico()
returns table(nombre text)
language sql stable security definer
set search_path = public, extensions
as $$
  select nombre from centros where activo = true order by nombre;
$$;

create or replace function public.consultar_stock_publico(p_centro_nombre text)
returns table(centro text, item text, stock_actual int, stock_minimo int, unidad text)
language sql stable security definer
set search_path = public, extensions
as $$
  select c.nombre, i.nombre, i.stock_actual, i.stock_minimo, i.unidad
  from items_inventario i
  join centros c on c.id = i.centro_id
  where c.nombre ilike '%' || p_centro_nombre || '%'
  order by i.nombre;
$$;

revoke execute on function public.listar_centros_publico() from public;
revoke execute on function public.consultar_stock_publico(text) from public;
grant execute on function public.listar_centros_publico() to anon, authenticated;
grant execute on function public.consultar_stock_publico(text) to anon, authenticated;
