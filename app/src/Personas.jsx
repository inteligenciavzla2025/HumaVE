import { useState } from 'react'
import { comprimirImagen } from './lib/imageCompress'
import { encolar } from './lib/syncQueue'
import { useOnlineSync } from './lib/useOnlineSync'

const SEXO_OPCIONES = ['M', 'F', 'Otro', 'No especificado']

export default function Personas({ usuario }) {
  const { sync } = useOnlineSync()
  const [foto, setFoto] = useState(null)
  const [comprimiendo, setComprimiendo] = useState(false)
  const [guardado, setGuardado] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    nombre: '',
    edad_aprox: '',
    sexo: '',
    doc_identidad: '',
    municipio_origen: '',
    condicion_medica: '',
    consentimiento: false,
  })

  function setField(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }))
  }

  async function handleFoto(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setComprimiendo(true)
    try {
      const blob = await comprimirImagen(file)
      setFoto(blob)
    } finally {
      setComprimiendo(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!form.consentimiento) {
      setError('El consentimiento es obligatorio para guardar el registro.')
      return
    }
    if (!form.nombre.trim()) {
      setError('El nombre es obligatorio.')
      return
    }
    if (!usuario?.centro_id) {
      setError('Tu usuario no tiene un centro asignado. No se puede registrar sin centro.')
      return
    }

    setGuardando(true)
    await encolar('personas', {
      nombre: form.nombre.trim(),
      edad_aprox: form.edad_aprox ? Number(form.edad_aprox) : null,
      sexo: form.sexo || null,
      doc_identidad: form.doc_identidad || null,
      municipio_origen: form.municipio_origen || null,
      condicion_medica: form.condicion_medica || null,
      consentimiento: true,
      consentimiento_ts: new Date().toISOString(),
      centro_registro_id: usuario.centro_id,
      registrado_por: usuario.id,
      ...(foto ? { _foto: foto } : {}),
    })
    setGuardando(false)
    setGuardado(true)
    setForm({
      nombre: '',
      edad_aprox: '',
      sexo: '',
      doc_identidad: '',
      municipio_origen: '',
      condicion_medica: '',
      consentimiento: false,
    })
    setFoto(null)
    sync()
    setTimeout(() => setGuardado(false), 3000)
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 max-w-md mx-auto space-y-4">
      <h2 className="font-semibold text-lg">Registrar persona</h2>

      <div>
        <label className="block text-sm text-slate-400 mb-1">Nombre *</label>
        <input
          required
          value={form.nombre}
          onChange={(e) => setField('nombre', e.target.value)}
          className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-slate-400 mb-1">Edad aprox.</label>
          <input
            type="number"
            min="0"
            max="120"
            value={form.edad_aprox}
            onChange={(e) => setField('edad_aprox', e.target.value)}
            className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">Sexo</label>
          <select
            value={form.sexo}
            onChange={(e) => setField('sexo', e.target.value)}
            className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-sm"
          >
            <option value="">—</option>
            {SEXO_OPCIONES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm text-slate-400 mb-1">Municipio de origen</label>
        <input
          value={form.municipio_origen}
          onChange={(e) => setField('municipio_origen', e.target.value)}
          className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm text-slate-400 mb-1">Condición médica</label>
        <textarea
          value={form.condicion_medica}
          onChange={(e) => setField('condicion_medica', e.target.value)}
          className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-sm"
          rows={2}
        />
      </div>

      <div>
        <label className="block text-sm text-slate-400 mb-1">Foto</label>
        <input type="file" accept="image/*" capture="environment" onChange={handleFoto} className="text-sm" />
        {comprimiendo && <p className="text-xs text-slate-500 mt-1">Comprimiendo imagen…</p>}
        {foto && !comprimiendo && (
          <p className="text-xs text-green-400 mt-1">Foto lista ({Math.round(foto.size / 1024)} KB)</p>
        )}
      </div>

      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.consentimiento}
          onChange={(e) => setField('consentimiento', e.target.checked)}
          className="mt-1"
        />
        <span>
          Confirmo que se obtuvo consentimiento para registrar los datos de esta persona. *
        </span>
      </label>

      {error && <p className="text-red-400 text-sm">{error}</p>}
      {guardado && <p className="text-green-400 text-sm">Guardado localmente ✓ se sincroniza automáticamente.</p>}

      <button
        type="submit"
        disabled={guardando}
        className="w-full rounded-md bg-blue-600 hover:bg-blue-500 disabled:opacity-50 py-2 text-sm font-medium"
      >
        {guardando ? 'Guardando…' : 'Guardar'}
      </button>
    </form>
  )
}
