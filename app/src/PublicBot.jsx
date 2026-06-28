import { useEffect, useRef, useState } from 'react'
import { supabase } from './lib/supabase'

function normalize(str) {
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

async function responderConsulta(texto, centros) {
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

export default function PublicBot() {
  const [centros, setCentros] = useState([])
  const [mensajes, setMensajes] = useState([
    {
      rol: 'bot',
      texto:
        'Hola! Soy el bot público de stock de HumanVe. Preguntame "stock de <centro>" o escribí "centros" para ver la lista. No necesitás cuenta para usarme.',
    },
  ])
  const [input, setInput] = useState('')
  const [enviando, setEnviando] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    supabase.rpc('listar_centros_publico').then(({ data, error }) => {
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
    <div className="min-h-svh flex flex-col bg-slate-900 text-white">
      <header className="px-4 py-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="HumanVe" className="h-7 w-7 rounded" />
          <h1 className="font-semibold">HumanVe — Consulta pública de stock</h1>
        </div>
        <p className="text-xs text-slate-500">No requiere cuenta. Solo muestra niveles de inventario.</p>
      </header>

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
