-- HumanVe — Esquema inicial
-- Basado en PRD+SDD v1.0, secciones 2.2, 2.6, 2.11
-- Ejecutar en Supabase Dashboard > SQL Editor (o via supabase db push)

create extension if not exists "uuid-ossp";

-- =========================================
-- TABLAS
-- =========================================

create table centros (
  id uuid primary key default uuid_generate_v4(),
  nombre text not null,
  tipo text check (tipo in ('refugio', 'hospital', 'clinica', 'acopio')),
  capacidad_max integer default 0,
  municipio text,
  direccion text,
  coordenadas text,
  activo boolean default true,
  creado_en timestamp default now()
);

create table usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  rol text check (rol in ('voluntario', 'operador', 'verificador', 'coordinador', 'ong')) not null,
  centro_id uuid references centros(id),
  nombre text,
  telefono text,
  activo boolean default true,
  creado_en timestamp default now()
);

create table personas (
  id uuid primary key default uuid_generate_v4(),
  nombre text not null,
  edad_aprox integer check (edad_aprox between 0 and 120),
  sexo text check (sexo in ('M', 'F', 'Otro', 'No especificado')),
  doc_identidad text,
  municipio_origen text,
  condicion_medica text,
  foto_url text,
  consentimiento boolean not null default false,
  consentimiento_ts timestamp,
  centro_registro_id uuid references centros(id) not null,
  registrado_por uuid references usuarios(id),
  creado_en timestamp default now(),
  activo boolean default true
);

create table items_inventario (
  id uuid primary key default uuid_generate_v4(),
  nombre text not null,
  categoria text check (categoria in ('alimentos', 'agua', 'medicamentos', 'ropa', 'otros')),
  unidad text,
  stock_minimo integer default 0,
  stock_actual integer default 0,
  centro_id uuid references centros(id) not null,
  creado_en timestamp default now()
);

create table movimientos_inventario (
  id uuid primary key default uuid_generate_v4(),
  item_id uuid references items_inventario(id) not null,
  tipo text check (tipo in ('entrada', 'salida', 'transferencia')) not null,
  cantidad integer not null check (cantidad > 0),
  lote text,
  vencimiento date,
  envio_id uuid,
  registrado_por uuid references usuarios(id),
  creado_en timestamp default now()
);

create table envios (
  id uuid primary key default uuid_generate_v4(),
  codigo text unique not null,
  centro_origen_id uuid references centros(id) not null,
  centro_destino_id uuid references centros(id) not null,
  estado text check (estado in ('preparando', 'en_transito', 'recibido', 'cancelado')) default 'preparando',
  responsable_id uuid references usuarios(id),
  creado_en timestamp default now(),
  recibido_en timestamp
);

alter table movimientos_inventario
  add constraint fk_movimientos_envio foreign key (envio_id) references envios(id);

create table aforo_registros (
  id uuid primary key default uuid_generate_v4(),
  centro_id uuid references centros(id) not null,
  persona_id uuid references personas(id),
  tipo text check (tipo in ('entrada', 'salida')) not null,
  registrado_por uuid references usuarios(id),
  creado_en timestamp default now()
);

create table desaparecidos (
  id uuid primary key default uuid_generate_v4(),
  nombre text not null,
  foto_url text,
  contacto_familiar text,
  estado text check (estado in ('buscando', 'encontrado', 'cerrado')) default 'buscando',
  creado_en timestamp default now()
);

create table coincidencias (
  id uuid primary key default uuid_generate_v4(),
  desaparecido_id uuid references desaparecidos(id) not null,
  persona_id uuid references personas(id) not null,
  verificador_id uuid references usuarios(id),
  estado text check (estado in ('pendiente', 'aprobada', 'rechazada')) default 'pendiente',
  creado_en timestamp default now()
);

-- =========================================
-- TRIGGERS Y FUNCIONES
-- =========================================

-- Actualiza stock al insertar movimiento (entrada/salida)
create or replace function actualizar_stock()
returns trigger as $$
begin
  if new.tipo = 'entrada' then
    update items_inventario set stock_actual = stock_actual + new.cantidad where id = new.item_id;
  elsif new.tipo = 'salida' then
    update items_inventario set stock_actual = stock_actual - new.cantidad where id = new.item_id;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trigger_stock
  after insert on movimientos_inventario
  for each row execute function actualizar_stock();

-- Aforo actual por centro (entradas - salidas del dia)
create or replace function aforo_actual(p_centro_id uuid)
returns table(aforo_actual int, capacidad_max int) as $$
  select
    (count(*) filter (where ar.tipo = 'entrada') - count(*) filter (where ar.tipo = 'salida'))::int,
    c.capacidad_max
  from aforo_registros ar
  join centros c on c.id = ar.centro_id
  where ar.centro_id = p_centro_id and date(ar.creado_en) = current_date
  group by c.capacidad_max;
$$ language sql;

-- Resumen de centros para n8n (sin PII) — usado en reporte nocturno
create or replace function resumen_centros()
returns table(
  centro text,
  tipo text,
  municipio text,
  aforo_actual int,
  capacidad_max int,
  porcentaje_ocupacion numeric,
  personas_registradas_hoy bigint,
  items_bajo_stock bigint,
  movimientos_hoy bigint
) as $$
  select
    c.nombre,
    c.tipo,
    c.municipio,
    coalesce(a.aforo_actual, 0),
    c.capacidad_max,
    case when c.capacidad_max > 0
      then round(coalesce(a.aforo_actual, 0)::numeric / c.capacidad_max * 100, 1)
      else 0
    end,
    (select count(*) from personas p where p.centro_registro_id = c.id and date(p.creado_en) = current_date),
    (select count(*) from items_inventario i where i.centro_id = c.id and i.stock_actual < i.stock_minimo),
    (select count(*) from movimientos_inventario m
      join items_inventario i on i.id = m.item_id
      where i.centro_id = c.id and date(m.creado_en) = current_date)
  from centros c
  left join lateral (select * from aforo_actual(c.id)) a on true
  where c.activo = true;
$$ language sql;

-- =========================================
-- ROW LEVEL SECURITY
-- =========================================

alter table personas enable row level security;
alter table items_inventario enable row level security;
alter table movimientos_inventario enable row level security;
alter table aforo_registros enable row level security;
alter table envios enable row level security;
alter table usuarios enable row level security;

-- Personas: voluntario/operador ven solo su centro
create policy voluntario_ver_personas on personas for select using (
  centro_registro_id = (select centro_id from usuarios where id = auth.uid())
);

-- Personas: coordinador ve todo
create policy coordinador_ver_todo on personas for select using (
  (select rol from usuarios where id = auth.uid()) = 'coordinador'
);

-- Personas: voluntario/operador/coordinador pueden insertar en su propio centro
create policy crear_personas on personas for insert with check (
  centro_registro_id = (select centro_id from usuarios where id = auth.uid())
  or (select rol from usuarios where id = auth.uid()) = 'coordinador'
);

-- Inventario: solo operador y coordinador modifican
create policy operador_inventario on movimientos_inventario for insert with check (
  (select rol from usuarios where id = auth.uid()) in ('operador', 'coordinador')
);

-- Inventario: lectura restringida al centro propio (excepto coordinador)
create policy ver_inventario_centro on items_inventario for select using (
  centro_id = (select centro_id from usuarios where id = auth.uid())
  or (select rol from usuarios where id = auth.uid()) = 'coordinador'
);

-- Aforo: cualquier rol autenticado de un centro puede leer/escribir el de su centro
create policy aforo_centro on aforo_registros for all using (
  centro_id = (select centro_id from usuarios where id = auth.uid())
  or (select rol from usuarios where id = auth.uid()) = 'coordinador'
);

-- Usuarios: cada uno ve su propio registro; coordinador ve todos
create policy ver_propio_usuario on usuarios for select using (
  id = auth.uid() or (select rol from usuarios where id = auth.uid()) = 'coordinador'
);
