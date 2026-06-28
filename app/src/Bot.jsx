import { useEffect, useRef, useState } from 'react'
import { supabase } from './lib/supabase'

function normalize(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function formatStockReply(centro, items) {
  if (items.length === 0) {
    return `${centro.nombre} no tiene items de inventario registrados todavia.`
  }
  const lineas = items.map((item) => {
    const alerta = item.stock_actual < item.stock_minimo ? ' ⚠️ BAJO MINIMO' : ''
    return `- ${item.nombre}: ${item.stock_actual} ${item.unidad ?? ''} (minimo ${item.stock_minimo})${alerta}`
  })
  return `Stock en ${centro.nombre}:\n${lineas.join('\n')}`
}

async function responderConsulta(texto, centros) {
  const textoNorm = normalize(texto)

  if (/^(ayuda|help|centros)$/.test(textoNorm.trim())) {
    if (centros.length === 0) return 'No hay centros registrados todavia.'
    return `Centros disponibles:\n${centros.map((c) => `- ${c.nombre}`).join('\n')}\n\nPreguntame "stock de <centro>" para ver el inventario.`
  }

  const coincidencias = centros.filter((c) =>
    normalize(c.nombre)
      .split(' ')
      .some((palabra) => palabra.length > 3 && textoNorm.includes(palabra))
  )

  if (coincidencias.length === 0) {
    return `No encontre ese centro. Escribi "centros" para ver la lista disponible.`
  }

  if (coincidencias.length > 1) {
    return `Encontre varios centros posibles: ${coincidencias.map((c) => c.nombre).join(', ')}. Se mas especifico.`
  }

  const centro = coincidencias[0]
  const { data: items, error } = await supabase
    .from('items_inventario')
    .select('nombre, unidad, stock_actual, stock_minimo')
    .eq('centro_id', centro.id)

  if (error) {
    return `No pude consultar el inventario de ${centro.nombre} (${error.message}). ¿Tenes sesion iniciada con un centro asignado?`
  }

  return formatStockReply(centro, items)
}

export default function Bot() {
  const [centros, setCentros] = useState([])
  const [mensajes, setMensajes] = useState([
    { rol: 'bot', texto: 'Hola! Preguntame "stock de <centro>" o escribi "centros" para ver la lista.' },
  ])
  const [input, setInput] = useState('')
  const [enviando, setEnviando] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    supabase
      .from('centros')
      .select('id, nombre')
      .then(({ data, error }) => {
        if (!error && data) setCentros(data)
      })
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [mensajes])

  async function handleSubmit(e) {
    e.preventDefault()
    const texto = input.trim()
    if (!texto || enviando) return

    setMensajes((m) => [...m, { rol: 'user', texto }])
    setInput('')
    setEnviando(true)

    const respuesta = await responderConsulta(texto, centros)
    setMensajes((m) => [...m, { rol: 'bot', texto: respuesta }])
    setEnviando(false)
  }

  return (
    <div className="flex flex-col h-full">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {mensajes.map((m, i) => (
          <div key={i} className={`flex ${m.rol === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm ${
                m.rol === 'user' ? 'bg-brand-navy' : 'bg-slate-800'
              }`}
            >
              {m.texto}
            </div>
          </div>
        ))}
        {enviando && <div className="text-slate-500 text-sm">Buscando…</div>}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 px-4 py-3 border-t border-slate-800">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="stock de Refugio Petare"
          className="flex-1 rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
        />
        <button
          type="submit"
          className="rounded-md bg-brand-navy hover:bg-brand-blue px-4 py-2 text-sm font-medium transition"
        >
          Enviar
        </button>
      </form>
    </div>
  )
}
