import { supabase } from './supabase'

export function normalize(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function formatStockReply(centroNombre, items) {
  if (items.length === 0) {
    return `${centroNombre} no tiene items de inventario registrados todavía.`
  }
  const lineas = items.map((item) => {
    const alerta = item.stock_actual < item.stock_minimo ? ' ⚠️ BAJO MÍNIMO' : ''
    return `- ${item.item}: ${item.stock_actual} ${item.unidad ?? ''} (mínimo ${item.stock_minimo})${alerta}`
  })
  return `Stock en ${centroNombre}:\n${lineas.join('\n')}`
}

export async function responderConsultaPublica(texto, centros) {
  const textoNorm = normalize(texto)

  if (/^(ayuda|help|centros)$/.test(textoNorm.trim())) {
    if (centros.length === 0) return 'No hay centros registrados todavía.'
    return `Centros disponibles:\n${centros.map((c) => `- ${c.nombre}`).join('\n')}\n\nPreguntame "stock de <centro>" para ver el inventario.`
  }

  const coincidencias = centros.filter((c) =>
    normalize(c.nombre)
      .split(' ')
      .some((palabra) => palabra.length > 3 && textoNorm.includes(palabra))
  )

  if (coincidencias.length === 0) {
    return 'No encontré ese centro. Escribí "centros" para ver la lista disponible.'
  }
  if (coincidencias.length > 1) {
    return `Encontré varios centros posibles: ${coincidencias.map((c) => c.nombre).join(', ')}. Sé más específico.`
  }

  const centro = coincidencias[0]
  const { data: items, error } = await supabase.rpc('consultar_stock_publico', {
    p_centro_nombre: centro.nombre,
  })

  if (error) {
    return `No pude consultar el inventario de ${centro.nombre} (${error.message}).`
  }

  return formatStockReply(centro.nombre, items)
}

export async function listarCentrosPublicos() {
  const { data, error } = await supabase.rpc('listar_centros_publico')
  if (error) return []
  return data ?? []
}
