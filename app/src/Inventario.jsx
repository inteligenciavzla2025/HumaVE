import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'

function ProgressBar({ actual, minimo }) {
  const bajo = actual < minimo
  const pct = minimo > 0 ? Math.min(100, Math.round((actual / (minimo * 2)) * 100)) : 100
  return (
    <div className="w-full h-2 rounded bg-slate-700 overflow-hidden">
      <div
        className={`h-full ${bajo ? 'bg-red-500' : 'bg-green-500'}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export default function Inventario({ usuario }) {
  const [items, setItems] = useState(null)
  const [error, setError] = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [form, setForm] = useState({ item_id: '', tipo: 'entrada', cantidad: '', lote: '' })
  const [guardando, setGuardando] = useState(false)

  const puedeEditar = usuario?.rol === 'operador' || usuario?.rol === 'coordinador'

  async function cargarItems() {
    const { data, error } = await supabase
      .from('items_inventario')
      .select('id, nombre, categoria, unidad, stock_minimo, stock_actual, centro_id, centros(nombre)')
      .order('nombre')

    if (error) {
      setError(error.message)
      return
    }
    setItems(data)
  }

  useEffect(() => {
    cargarItems()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.item_id || !form.cantidad) return
    setGuardando(true)
    setError('')

    const { error } = await supabase.from('movimientos_inventario').insert({
      item_id: form.item_id,
      tipo: form.tipo,
      cantidad: Number(form.cantidad),
      lote: form.lote || null,
      registrado_por: usuario.id,
    })

    setGuardando(false)

    if (error) {
      setError(error.message)
      return
    }

    setForm({ item_id: '', tipo: 'entrada', cantidad: '', lote: '' })
    setMostrarForm(false)
    cargarItems()
  }

  if (items === null) {
    return <div className="p-4 text-slate-400 text-sm">Cargando inventario…</div>
  }

  const grupos = items.reduce((acc, item) => {
    const centro = item.centros?.nombre ?? 'Sin centro'
    acc[centro] = acc[centro] || []
    acc[centro].push(item)
    return acc
  }, {})

  return (
    <div className="p-4 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-lg">Inventario</h2>
        {puedeEditar && (
          <button
            onClick={() => setMostrarForm((v) => !v)}
            className="text-sm bg-blue-600 hover:bg-blue-500 rounded-md px-3 py-1"
          >
            + Movimiento
          </button>
        )}
      </div>

      {mostrarForm && (
        <form onSubmit={handleSubmit} className="bg-slate-800 rounded-md p-3 mb-4 space-y-2">
          <select
            required
            value={form.item_id}
            onChange={(e) => setForm((f) => ({ ...f, item_id: e.target.value }))}
            className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm"
          >
            <option value="">Seleccionar item…</option>
            {items.map((i) => (
              <option key={i.id} value={i.id}>
                {i.nombre} {i.centros?.nombre ? `(${i.centros.nombre})` : ''}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={form.tipo}
              onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}
              className="rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm"
            >
              <option value="entrada">Entrada</option>
              <option value="salida">Salida</option>
            </select>
            <input
              required
              type="number"
              min="1"
              placeholder="Cantidad"
              value={form.cantidad}
              onChange={(e) => setForm((f) => ({ ...f, cantidad: e.target.value }))}
              className="rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm"
            />
          </div>
          <input
            placeholder="Lote (opcional)"
            value={form.lote}
            onChange={(e) => setForm((f) => ({ ...f, lote: e.target.value }))}
            className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={guardando}
            className="w-full rounded-md bg-blue-600 hover:bg-blue-500 disabled:opacity-50 py-2 text-sm font-medium"
          >
            {guardando ? 'Guardando…' : 'Registrar'}
          </button>
        </form>
      )}

      {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

      {Object.entries(grupos).map(([centro, itemsCentro]) => (
        <div key={centro} className="mb-4">
          {Object.keys(grupos).length > 1 && (
            <h3 className="text-xs uppercase text-slate-500 mb-2">{centro}</h3>
          )}
          <div className="space-y-2">
            {itemsCentro.map((item) => {
              const bajo = item.stock_actual < item.stock_minimo
              return (
                <div key={item.id} className="bg-slate-800 rounded-md p-3">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-sm font-medium">{item.nombre}</span>
                    <span className={`text-xs ${bajo ? 'text-red-400' : 'text-slate-400'}`}>
                      {item.stock_actual} {item.unidad} {bajo && '⚠️'}
                    </span>
                  </div>
                  <ProgressBar actual={item.stock_actual} minimo={item.stock_minimo} />
                  <div className="text-xs text-slate-500 mt-1">mínimo {item.stock_minimo}</div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {items.length === 0 && <p className="text-slate-400 text-sm">No hay items de inventario.</p>}
    </div>
  )
}
