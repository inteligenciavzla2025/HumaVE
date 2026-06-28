-- RPC publica (sin login) para la landing real (app/src/Landing.jsx):
-- solo counts agregados, nunca filas individuales. Reemplaza los numeros
-- inventados del mockup de diseno (312, etc.) por datos reales de Supabase.

create or replace function public.estadisticas_publicas()
returns table(personas_registradas bigint, centros_activos bigint, movimientos_hoy bigint)
language sql stable security definer
set search_path = public, extensions
as $$
  select
    (select count(*) from personas where activo = true),
    (select count(*) from centros where activo = true),
    (select count(*) from movimientos_inventario where date(creado_en) = current_date);
$$;

revoke execute on function public.estadisticas_publicas() from public;
grant execute on function public.estadisticas_publicas() to anon, authenticated;
