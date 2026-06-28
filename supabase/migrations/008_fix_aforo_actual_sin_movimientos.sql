-- Bug: aforo_actual() hacia INNER JOIN desde aforo_registros -> si un
-- centro no tiene NINGUN movimiento de aforo hoy, el join no produce
-- filas y la funcion devuelve un resultado VACIO en vez de
-- {aforo_actual: 0, capacidad_max: <real>}. resumen_centros() lo
-- enmascaraba porque toma capacidad_max directo de la tabla centros, no
-- del retorno de esta funcion -- el bug solo aparecia al llamar
-- aforo_actual() directamente (panel de check-in del operador).
--
-- Detectado al probar el modulo Aforo end-to-end: el panel mostraba
-- "0/0" en vez de "0/60" para un centro sin movimientos registrados.

create or replace function public.aforo_actual(p_centro_id uuid)
returns table(aforo_actual int, capacidad_max int)
language sql stable
set search_path = public, extensions
as $$
  select
    (
      select count(*) filter (where ar.tipo = 'entrada') - count(*) filter (where ar.tipo = 'salida')
      from aforo_registros ar
      where ar.centro_id = p_centro_id and date(ar.creado_en) = current_date
    )::int,
    c.capacidad_max
  from centros c
  where c.id = p_centro_id;
$$;
