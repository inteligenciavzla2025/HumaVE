-- Bug: movimientos_inventario solo tenia politica de INSERT
-- (operador_inventario en 002_security_performance_fixes.sql), nunca de
-- SELECT. Cualquier lectura de movimientos (ej. el Edge Function
-- generar_acta_envio armando el listado de items de un envio) devolvia
-- 0 filas silenciosamente por RLS, sin error -- el acta de envio se
-- generaba siempre con "(sin items)".
--
-- Detectado end-to-end probando el modulo Envios completo en el
-- navegador: el insert del movimiento funcionaba, pero el Edge Function
-- no podia leerlo de vuelta para armar el texto del acta.

create policy ver_movimientos_inventario on movimientos_inventario for select using (
  item_id in (
    select id from items_inventario
    where centro_id = usuario_centro() or usuario_rol() = 'coordinador'
  )
);
