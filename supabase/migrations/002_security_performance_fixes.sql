-- Fixes encontrados por `get_advisors` (security + performance) sobre 001_initial.sql

-- =========================================
-- POLITICAS RLS FALTANTES (centros, envios, desaparecidos, coincidencias)
-- =========================================
-- 001_initial.sql habilito RLS en estas tablas pero solo documento 3
-- politicas "de ejemplo" (PRD seccion 2.6). RLS habilitado sin policy
-- bloquea TODO acceso, no lo deja abierto -- habia que completar el set.

alter table centros enable row level security;
alter table envios enable row level security;
alter table desaparecidos enable row level security;
alter table coincidencias enable row level security;

create policy ver_centros on centros for select using (
  (select auth.uid()) is not null
);

create policy admin_centros on centros for insert with check (
  (select rol from usuarios where id = (select auth.uid())) = 'coordinador'
);

create policy editar_centros on centros for update using (
  (select rol from usuarios where id = (select auth.uid())) = 'coordinador'
);

create policy ver_envios on envios for select using (
  centro_origen_id = (select centro_id from usuarios where id = (select auth.uid()))
  or centro_destino_id = (select centro_id from usuarios where id = (select auth.uid()))
  or (select rol from usuarios where id = (select auth.uid())) = 'coordinador'
);

create policy crear_envios on envios for insert with check (
  (select rol from usuarios where id = (select auth.uid())) in ('operador', 'coordinador')
);

create policy actualizar_envios on envios for update using (
  centro_origen_id = (select centro_id from usuarios where id = (select auth.uid()))
  or centro_destino_id = (select centro_id from usuarios where id = (select auth.uid()))
  or (select rol from usuarios where id = (select auth.uid())) = 'coordinador'
);

-- Desaparecidos: las fotos solo son visibles para verificador/coordinador (PRD 2.5)
create policy crear_desaparecidos on desaparecidos for insert with check (
  (select auth.uid()) is not null
);

create policy ver_desaparecidos on desaparecidos for select using (
  (select rol from usuarios where id = (select auth.uid())) in ('verificador', 'coordinador')
);

create policy actualizar_desaparecidos on desaparecidos for update using (
  (select rol from usuarios where id = (select auth.uid())) in ('verificador', 'coordinador')
);

create policy ver_coincidencias on coincidencias for select using (
  (select rol from usuarios where id = (select auth.uid())) in ('verificador', 'coordinador')
);

create policy crear_coincidencias on coincidencias for insert with check (
  (select rol from usuarios where id = (select auth.uid())) in ('verificador', 'coordinador')
);

create policy actualizar_coincidencias on coincidencias for update using (
  (select rol from usuarios where id = (select auth.uid())) in ('verificador', 'coordinador')
);

-- =========================================
-- CONSOLIDAR POLITICAS DE PERSONAS (evita doble evaluacion) + FIX auth.uid()
-- =========================================

drop policy if exists voluntario_ver_personas on personas;
drop policy if exists coordinador_ver_todo on personas;
drop policy if exists crear_personas on personas;

create policy ver_personas on personas for select using (
  centro_registro_id = (select centro_id from usuarios where id = (select auth.uid()))
  or (select rol from usuarios where id = (select auth.uid())) = 'coordinador'
);

create policy crear_personas on personas for insert with check (
  centro_registro_id = (select centro_id from usuarios where id = (select auth.uid()))
  or (select rol from usuarios where id = (select auth.uid())) = 'coordinador'
);

-- =========================================
-- FIX auth.uid() EN POLITICAS EXISTENTES (performance)
-- =========================================
-- Envolver auth.uid() en (select auth.uid()) evita que postgres lo
-- reevalue fila por fila (patron documentado por Supabase).

drop policy if exists operador_inventario on movimientos_inventario;
create policy operador_inventario on movimientos_inventario for insert with check (
  (select rol from usuarios where id = (select auth.uid())) in ('operador', 'coordinador')
);

drop policy if exists ver_inventario_centro on items_inventario;
create policy ver_inventario_centro on items_inventario for select using (
  centro_id = (select centro_id from usuarios where id = (select auth.uid()))
  or (select rol from usuarios where id = (select auth.uid())) = 'coordinador'
);

drop policy if exists aforo_centro on aforo_registros;
create policy aforo_centro on aforo_registros for all using (
  centro_id = (select centro_id from usuarios where id = (select auth.uid()))
  or (select rol from usuarios where id = (select auth.uid())) = 'coordinador'
);

drop policy if exists ver_propio_usuario on usuarios;
create policy ver_propio_usuario on usuarios for select using (
  id = (select auth.uid()) or (select rol from usuarios where id = (select auth.uid())) = 'coordinador'
);

-- =========================================
-- FIX search_path MUTABLE EN FUNCIONES
-- =========================================

alter function public.actualizar_stock() set search_path = public, extensions;
alter function public.aforo_actual(uuid) set search_path = public, extensions;
alter function public.resumen_centros() set search_path = public, extensions;

-- =========================================
-- INDICES PARA FOREIGN KEYS (performance)
-- =========================================

create index if not exists idx_aforo_registros_centro_id on aforo_registros(centro_id);
create index if not exists idx_aforo_registros_persona_id on aforo_registros(persona_id);
create index if not exists idx_aforo_registros_registrado_por on aforo_registros(registrado_por);
create index if not exists idx_coincidencias_desaparecido_id on coincidencias(desaparecido_id);
create index if not exists idx_coincidencias_persona_id on coincidencias(persona_id);
create index if not exists idx_coincidencias_verificador_id on coincidencias(verificador_id);
create index if not exists idx_envios_centro_destino_id on envios(centro_destino_id);
create index if not exists idx_envios_centro_origen_id on envios(centro_origen_id);
create index if not exists idx_envios_responsable_id on envios(responsable_id);
create index if not exists idx_items_inventario_centro_id on items_inventario(centro_id);
create index if not exists idx_movimientos_inventario_envio_id on movimientos_inventario(envio_id);
create index if not exists idx_movimientos_inventario_item_id on movimientos_inventario(item_id);
create index if not exists idx_movimientos_inventario_registrado_por on movimientos_inventario(registrado_por);
create index if not exists idx_personas_centro_registro_id on personas(centro_registro_id);
create index if not exists idx_personas_registrado_por on personas(registrado_por);
create index if not exists idx_usuarios_centro_id on usuarios(centro_id);
