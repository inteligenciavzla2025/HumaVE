import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'

function colorAforo(pct) {
  if (pct > 90) return 'text-red-400 border-red-500'
  if (pct >= 70) return 'text-yellow-400 border-yellow-500'
  return 'text-green-400 border-green-500'
}

function normalize(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function PanelOperador({ usuario }) {
  const [aforo, setAforo] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [personas, setPersonas] = useState([])
  const [mensaje, setMensaje] = useState('')

  async function cargarAforo() {
    const { data } = await supabase.rpc('aforo_actual', { p_centro_id: usuario.centro_id })
    setAforo(data?.[0] ?? { aforo_actual: 0, capacidad_max: 0 })
  }

  useEffect(() => {
    if (usuario?.centro_id) cargarAforo()
  }, [usuario?.centro_id])

  async function buscarPersonas(texto) {
    setBusqueda(texto)
    if (!texto.trim()) {
      setPersonas([])
      return
    }
    const { data } = await supabase
      .from('personas')
      .select('id, nombre')
      .eq('centro_registro_id', usuario.centro_id)
      .limit(100)
    const norm = normalize(texto)
    setPersonas((data ?? []).filter((p) => normalize(p.nombre).includes(norm)))
  }

  async function registrar(persona, tipo) {
    setMensaje('')
    const { data: ultimo } = await supabase
      .from('aforo_registros')
      .select('tipo')
      .eq('persona_id', persona.id)
      .eq('centro_id', usuario.centro_id)
      .order('creado_en', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (tipo === 'entrada' && ultimo?.tipo === 'entrada') {
      setMensaje(`${persona.nombre} ya tiene una entrada activa.`)
      return
    }
    if (tipo === 'salida' && (!ultimo || ultimo.tipo === 'salida')) {
      setMensaje(`${persona.nombre} no tiene una entrada activa para registrar salida.`)
      return
    }

    const { error } = await supabase.from('aforo_registros').insert({
      centro_id: usuario.centro_id,
      persona_id: persona.id,
      tipo,
      registrado_por: usuario.id,
    })

    if (error) {
      setMensaje(error.message)
      return
    }

    setMensaje(`${tipo === 'entrada' ? 'Entrada' : 'Salida'} registrada para ${persona.nombre}.`)
    setBusqueda('')
    setPersonas([])
    cargarAforo()
  }

  if (!aforo) return <div className="p-4 text-slate-400 text-sm">Cargando aforo…</div>

  const pct = aforo.capacidad_max > 0 ? Math.round((aforo.aforo_actual / aforo.capacidad_max) * 100) : 0

  return (
    <div className="p-4 max-w-md mx-auto">
      <div className={`border-2 rounded-lg p-6 text-center mb-4 ${colorAforo(pct)}`}>
        <div className="text-4xl font-bold">
          {aforo.aforo_actual}/{aforo.capacidad_max}
        </div>
        <div className="text-sm mt-1">{pct}% de ocupación</div>
      </div>

      <input
        placeholder="Buscar persona registrada…"
        value={busqueda}
        onChange={(e) => buscarPersonas(e.target.value)}
        className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-sm mb-2"
      />

      {mensaje && <p className="text-sm text-yellow-400 mb-2">{mensaje}</p>}

      <div className="space-y-2">
        {personas.map((p) => (
          <div key={p.id} className="flex items-center justify-between bg-slate-800 rounded-md p-2">
            <span className="text-sm">{p.nombre}</span>
            <div className="flex gap-2">
              <button
                onClick={() => registrar(p, 'entrada')}
                className="text-xs bg-green-600 hover:bg-green-500 rounded px-2 py-1"
              >
                Entrada
              </button>
              <button
                onClick={() => registrar(p, 'salida')}
                className="text-xs bg-red-600 hover:bg-red-500 rounded px-2 py-1"
              >
                Salida
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function DashboardCoordinador() {
  const [centros, setCentros] = useState(null)

  useEffect(() => {
    supabase.rpc('resumen_centros').then(({ data }) => setCentros(data ?? []))
  }, [])

  if (centros === null) return <div className="p-4 text-slate-400 text-sm">Cargando dashboard…</div>

  return (
    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
      {centros.map((c) => (
        <div
          key={c.centro}
          className={`border-2 rounded-lg p-4 ${colorAforo(c.porcentaje_ocupacion)}`}
        >
          <div className="font-semibold">{c.centro}</div>
          <div className="text-2xl font-bold mt-1">
            {c.aforo_actual}/{c.capacidad_max}
          </div>
          <div className="text-xs mt-1">{c.porcentaje_ocupacion}% ocupación</div>
          <div className="text-xs text-slate-400 mt-2">
            {c.personas_registradas_hoy} personas hoy · {c.items_bajo_stock} items bajo stock
          </div>
        </div>
      ))}
      {centros.length === 0 && <p className="text-slate-400 text-sm">No hay centros activos.</p>}
    </div>
  )
}

export default function Aforo({ usuario }) {
  if (!usuario) return <div className="p-4 text-slate-400 text-sm">Cargando…</div>

  if (usuario.rol === 'coordinador') return <DashboardCoordinador />

  if (!usuario.centro_id) {
    return <div className="p-4 text-slate-400 text-sm">Tu usuario no tiene centro asignado.</div>
  }

  return <PanelOperador usuario={usuario} />
}
