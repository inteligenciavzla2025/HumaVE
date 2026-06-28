import { useState } from 'react'
import { supabase } from './lib/supabase'

function normalize(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export default function Buscar() {
  const [nombre, setNombre] = useState('')
  const [edad, setEdad] = useState('')
  const [sexo, setSexo] = useState('')
  const [municipio, setMunicipio] = useState('')
  const [resultados, setResultados] = useState(null)
  const [buscando, setBuscando] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setBuscando(true)
    setError('')

    const { data, error } = await supabase
      .from('personas')
      .select('id, nombre, edad_aprox, sexo, municipio_origen, foto_url, creado_en, centros(nombre)')
      .eq('activo', true)
      .limit(200)

    setBuscando(false)

    if (error) {
      setError(error.message)
      return
    }

    const nombreNorm = normalize(nombre)
    const municipioNorm = normalize(municipio)
    const edadNum = edad ? Number(edad) : null

    const filtrados = data.filter((p) => {
      if (nombreNorm && !normalize(p.nombre).includes(nombreNorm)) return false
      if (sexo && p.sexo !== sexo) return false
      if (municipioNorm && !normalize(p.municipio_origen).includes(municipioNorm)) return false
      if (edadNum !== null && p.edad_aprox !== null) {
        if (Math.abs(p.edad_aprox - edadNum) > 10) return false
      }
      return true
    })

    setResultados(filtrados)
  }

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="font-semibold text-lg mb-3">Buscar persona</h2>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          placeholder="Nombre (parcial)"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-sm"
        />
        <div className="grid grid-cols-3 gap-2">
          <input
            type="number"
            placeholder="Edad ±10"
            value={edad}
            onChange={(e) => setEdad(e.target.value)}
            className="rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-sm"
          />
          <select
            value={sexo}
            onChange={(e) => setSexo(e.target.value)}
            className="rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-sm"
          >
            <option value="">Sexo</option>
            <option value="M">M</option>
            <option value="F">F</option>
            <option value="Otro">Otro</option>
          </select>
          <input
            placeholder="Municipio"
            value={municipio}
            onChange={(e) => setMunicipio(e.target.value)}
            className="rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={buscando}
          className="w-full rounded-md bg-blue-600 hover:bg-blue-500 disabled:opacity-50 py-2 text-sm font-medium"
        >
          {buscando ? 'Buscando…' : 'Buscar'}
        </button>
      </form>

      {error && <p className="text-red-400 text-sm mt-3">{error}</p>}

      {resultados !== null && (
        <div className="mt-4 space-y-2">
          {resultados.length === 0 ? (
            <p className="text-slate-400 text-sm">No se encontraron personas.</p>
          ) : (
            resultados.map((p) => (
              <div key={p.id} className="flex items-center gap-3 bg-slate-800 rounded-md p-2">
                {p.foto_url ? (
                  <img src={p.foto_url} alt={p.nombre} className="w-12 h-12 rounded object-cover bg-slate-700" />
                ) : (
                  <div className="w-12 h-12 rounded bg-slate-700 flex items-center justify-center text-xs text-slate-500">
                    sin foto
                  </div>
                )}
                <div className="text-sm">
                  <div className="font-medium">{p.nombre}</div>
                  <div className="text-slate-400 text-xs">
                    {p.centros?.nombre ?? 'Centro desconocido'} · {new Date(p.creado_en).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
