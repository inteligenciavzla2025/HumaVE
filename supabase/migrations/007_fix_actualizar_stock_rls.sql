-- Bug critico: el trigger actualizar_stock() corria SECURITY INVOKER por
-- defecto, es decir con los privilegios del usuario autenticado que dispara
-- el INSERT en movimientos_inventario. Como nunca existio una politica RLS
-- de UPDATE en items_inventario, el UPDATE interno del trigger afectaba
-- 0 filas silenciosamente (Postgres no lanza error si un UPDATE no matchea
-- ninguna fila por RLS) -- el stock NUNCA se actualizaba para ningun
-- usuario real de la app, solo "funcionaba" cuando se probaba via
-- execute_sql (rol con privilegios elevados que bypasea RLS).
--
-- Descubierto recien al probar el modulo Inventario end-to-end con un
-- usuario real autenticado en el navegador -- las pruebas anteriores via
-- execute_sql nunca lo hubieran detectado.
--
-- Fix: marcar la funcion SECURITY DEFINER (mismo patron que
-- usuario_rol/usuario_centro en 004_fix_rls_recursion.sql) para que el
-- UPDATE interno corra con privilegios del owner y no quede sujeto a RLS.
-- La autorizacion real ya la da la politica de INSERT en
-- movimientos_inventario (solo operador/coordinador disparan el trigger).

create or replace function public.actualizar_stock()
returns trigger
security definer
set search_path = public, extensions
as $$
begin
  if new.tipo = 'entrada' then
    update items_inventario set stock_actual = stock_actual + new.cantidad where id = new.item_id;
  elsif new.tipo = 'salida' then
    update items_inventario set stock_actual = stock_actual - new.cantidad where id = new.item_id;
  end if;
  return new;
end;
$$ language plpgsql;

revoke execute on function public.actualizar_stock() from public;
