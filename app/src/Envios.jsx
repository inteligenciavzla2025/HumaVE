import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'

export default function Envios({ usuario }) {
  const [centros, setCentros] = useState([])
  const [items, setItems] = useState([])
  const [centroDestino, setCentroDestino] = useState('')
  const [lineas, setLineas] = useState([{ item_id: '', cantidad: '' }])
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [acta, setActa] = useState(null)

  useEffect(() => {
    supabase
      .from('centros')
      .select('id, nombre')
      .then(({ data }) => setCentros((data ?? []).filter((c) => c.id !== usuario?.centro_id)))
    if (usuario?.centro_id) {
      supabase
        .from('items_inventario')
        .select('id, nombre, unidad, stock_actual')
        .eq('centro_id', usuario.centro_id)
        .then(({ data }) => setItems(data ?? []))
    }
  }, [usuario?.centro_id])

  function setLinea(i, campo, valor) {
    setLineas((ls) => ls.map((l, idx) => (idx === i ? { ...l, [campo]: valor } : l)))
  }

  function agregarLinea() {
    setLineas((ls) => [...ls, { item_id: '', cantidad: '' }])
  }

  function quitarLinea(i) {
    setLineas((ls) => ls.filter((_, idx) => idx !== i))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!usuario?.centro_id) {
      setError('Tu usuario no tiene un centro asignado.')
      return
    }
    if (!centroDestino) {
      setError('Elegí un centro destino.')
      return
    }
    const lineasValidas = lineas.filter((l) => l.item_id && l.cantidad)
    if (lineasValidas.length === 0) {
      setError('Agregá al menos un item con cantidad.')
      return
    }

    setEnviando(true)

    const codigo = `ENV-${Date.now().toString(36).toUpperCase()}`

    const { data: envio, error: envioError } = await supabase
      .from('envios')
      .insert({
        codigo,
        centro_origen_id: usuario.centro_id,
        centro_destino_id: centroDestino,
        responsable_id: usuario.id,
        estado: 'preparando',
      })
      .select()
      .single()

    if (envioError) {
      setError(envioError.message)
      setEnviando(false)
      return
    }

    for (const linea of lineasValidas) {
      const { error: movError } = await supabase.from('movimientos_inventario').insert({
        item_id: linea.item_id,
        tipo: 'salida',
        cantidad: Number(linea.cantidad),
        envio_id: envio.id,
        registrado_por: usuario.id,
      })
      if (movError) {
        setError(movError.message)
        setEnviando(false)
        return
      }
    }

    const { data: sessionData } = await supabase.auth.getSession()
    const { data: actaData, error: actaError } = await supabase.functions.invoke('generar_acta_envio', {
      body: { envio_id: envio.id },
      headers: { Authorization: `Bearer ${sessionData.session.access_token}` },
    })

    setEnviando(false)

    if (actaError) {
      setError(`Envío guardado, pero no se pudo generar el acta: ${actaError.message}`)
      return
    }

    setActa(actaData.texto)
    setLineas([{ item_id: '', cantidad: '' }])
    setCentroDestino('')
  }

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="font-semibold text-lg mb-3">Nuevo envío</h2>

      {!acta ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <select
            value={centroDestino}
            onChange={(e) => setCentroDestino(e.target.value)}
            className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-sm"
          >
            <option value="">Centro destino…</option>
            {centros.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>

          {lineas.map((l, i) => (
            <div key={i} className="flex gap-2">
              <select
                value={l.item_id}
                onChange={(e) => setLinea(i, 'item_id', e.target.value)}
                className="flex-1 rounded-md bg-slate-800 border border-slate-700 px-2 py-2 text-sm"
              >
                <option value="">Item…</option>
                {items.map((it) => (
                  <option key={it.id} value={it.id}>
                    {it.nombre} ({it.stock_actual} disp.)
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                placeholder="Cant."
                value={l.cantidad}
                onChange={(e) => setLinea(i, 'cantidad', e.target.value)}
                className="w-20 rounded-md bg-slate-800 border border-slate-700 px-2 py-2 text-sm"
              />
              {lineas.length > 1 && (
                <button type="button" onClick={() => quitarLinea(i)} className="text-slate-500 hover:text-red-400">
                  ✕
                </button>
              )}
            </div>
          ))}

          <button type="button" onClick={agregarLinea} className="text-sm text-brand-gold hover:text-brand-yellow">
            + agregar item
          </button>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={enviando}
            className="w-full rounded-md bg-brand-navy hover:bg-brand-blue disabled:opacity-50 py-2 text-sm font-medium"
          >
            {enviando ? 'Generando acta…' : 'Generar acta de envío'}
          </button>
        </form>
      ) : (
        <div className="space-y-3">
          <pre className="bg-slate-800 rounded-md p-3 text-sm whitespace-pre-wrap">{acta}</pre>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(acta)}`}
            target="_blank"
            rel="noreferrer"
            className="block text-center w-full rounded-md bg-green-600 hover:bg-green-500 py-2 text-sm font-medium"
          >
            Compartir por WhatsApp
          </a>
          <button
            onClick={() => setActa(null)}
            className="w-full rounded-md bg-slate-700 hover:bg-slate-600 py-2 text-sm"
          >
            Nuevo envío
          </button>
        </div>
      )}
    </div>
  )
}
