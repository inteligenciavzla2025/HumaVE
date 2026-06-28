-- Fix: recursion infinita en RLS
--
-- La politica de "usuarios" resolvia el rol del usuario actual consultando
-- la propia tabla "usuarios" dentro de su USING clause. Como casi todas las
-- demas politicas (personas, items_inventario, aforo_registros, envios,
-- desaparecidos, coincidencias, centros) tambien consultan "usuarios" para
-- resolver rol/centro_id, cualquier query disparaba la politica de usuarios,
-- que a su vez se volvia a disparar a si misma -> "infinite recursion
-- detected in policy for relation usuarios".
--
-- Fix (patron oficial de Supabase): mover esas consultas a funciones
-- SECURITY DEFINER, que corren con privilegios del owner y no reactivan RLS
-- sobre la tabla que consultan internamente.

create or replace function public.usuario_rol()
returns text
language sql security definer stable
set search_path = public
as $$
  select rol from usuarios where id = auth.uid();
$$;

create or replace function public.usuario_centro()
returns uuid
language sql security definer stable
set search_path = public
as $$
  select centro_id from usuarios where id = auth.uid();
$$;

revoke execute on function public.usuario_rol() from public;
revoke execute on function public.usuario_centro() from public;
grant execute on function public.usuario_rol() to anon, authenticated;
grant execute on function public.usuario_centro() to anon, authenticated;

drop policy if exists ver_propio_usuario on usuarios;
create policy ver_propio_usuario on usuarios for select using (
  id = (select auth.uid()) or usuario_rol() = 'coordinador'
);

drop policy if exists admin_centros on centros;
create policy admin_centros on centros for insert with check (usuario_rol() = 'coordinador');

drop policy if exists editar_centros on centros;
create policy editar_centros on centros for update using (usuario_rol() = 'coordinador');

drop policy if exists ver_personas on personas;
create policy ver_personas on personas for select using (
  centro_registro_id = usuario_centro() or usuario_rol() = 'coordinador'
);

drop policy if exists crear_personas on personas;
create policy crear_personas on personas for insert with check (
  centro_registro_id = usuario_centro() or usuario_rol() = 'coordinador'
);

drop policy if exists ver_inventario_centro on items_inventario;
create policy ver_inventario_centro on items_inventario for select using (
  centro_id = usuario_centro() or usuario_rol() = 'coordinador'
);

drop policy if exists operador_inventario on movimientos_inventario;
create policy operador_inventario on movimientos_inventario for insert with check (
  usuario_rol() in ('operador', 'coordinador')
);

drop policy if exists aforo_centro on aforo_registros;
create policy aforo_centro on aforo_registros for all using (
  centro_id = usuario_centro() or usuario_rol() = 'coordinador'
);

drop policy if exists ver_envios on envios;
create policy ver_envios on envios for select using (
  centro_origen_id = usuario_centro() or centro_destino_id = usuario_centro() or usuario_rol() = 'coordinador'
);

drop policy if exists crear_envios on envios;
create policy crear_envios on envios for insert with check (
  usuario_rol() in ('operador', 'coordinador')
);

drop policy if exists actualizar_envios on envios;
create policy actualizar_envios on envios for update using (
  centro_origen_id = usuario_centro() or centro_destino_id = usuario_centro() or usuario_rol() = 'coordinador'
);

drop policy if exists ver_desaparecidos on desaparecidos;
create policy ver_desaparecidos on desaparecidos for select using (
  usuario_rol() in ('verificador', 'coordinador')
);

drop policy if exists actualizar_desaparecidos on desaparecidos;
create policy actualizar_desaparecidos on desaparecidos for update using (
  usuario_rol() in ('verificador', 'coordinador')
);

drop policy if exists ver_coincidencias on coincidencias;
create policy ver_coincidencias on coincidencias for select using (
  usuario_rol() in ('verificador', 'coordinador')
);

drop policy if exists crear_coincidencias on coincidencias;
create policy crear_coincidencias on coincidencias for insert with check (
  usuario_rol() in ('verificador', 'coordinador')
);

drop policy if exists actualizar_coincidencias on coincidencias;
create policy actualizar_coincidencias on coincidencias for update using (
  usuario_rol() in ('verificador', 'coordinador')
);
