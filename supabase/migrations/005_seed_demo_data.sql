-- Datos de demo para probar el bot de stock y el flujo de login.
-- Reemplazar/borrar antes de producción real con los centros piloto.

insert into centros (nombre, tipo, capacidad_max, municipio, activo) values
  ('Refugio Petare Norte', 'refugio', 60, 'Sucre', true),
  ('Acopio Catia', 'acopio', 0, 'Libertador', true)
on conflict do nothing;

insert into items_inventario (nombre, categoria, unidad, stock_minimo, stock_actual, centro_id)
select 'Agua potable', 'agua', 'litros', 100, 350, id from centros where nombre = 'Refugio Petare Norte'
union all
select 'Arroz', 'alimentos', 'kg', 50, 20, id from centros where nombre = 'Refugio Petare Norte'
union all
select 'Paracetamol', 'medicamentos', 'cajas', 10, 3, id from centros where nombre = 'Refugio Petare Norte'
union all
select 'Agua potable', 'agua', 'litros', 200, 500, id from centros where nombre = 'Acopio Catia'
union all
select 'Leche en polvo', 'alimentos', 'kg', 30, 45, id from centros where nombre = 'Acopio Catia';
