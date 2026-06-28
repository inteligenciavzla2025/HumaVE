import { openDB } from 'idb'

const DB_NAME = 'humave'
const DB_VERSION = 1
const STORE = 'sync_queue'

function getDb() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'localId', autoIncrement: true })
        store.createIndex('estado', 'estado')
      }
    },
  })
}

// Encola una operacion pendiente de sincronizar. `datos` debe ser serializable
// (si hay foto, pasar el Blob ya comprimido; IndexedDB soporta Blobs nativos).
export async function encolar(tabla, datos) {
  const db = await getDb()
  const localId = await db.add(STORE, {
    tabla,
    datos,
    estado: 'pendiente',
    creado_en: new Date().toISOString(),
  })
  return localId
}

export async function listarPendientes() {
  const db = await getDb()
  return db.getAllFromIndex(STORE, 'estado', 'pendiente')
}

export async function contarPendientes() {
  const pendientes = await listarPendientes()
  return pendientes.length
}

async function marcarEstado(localId, estado, motivo) {
  const db = await getDb()
  const item = await db.get(STORE, localId)
  if (!item) return
  item.estado = estado
  if (motivo) item.motivo = motivo
  await db.put(STORE, item)
}

// Sube la foto (si hay) a Storage y devuelve el payload final para insertar.
async function resolverFoto(supabase, datos) {
  if (!datos._foto) return datos
  const { _foto, ...resto } = datos
  const path = `${crypto.randomUUID()}.jpg`
  const { error: uploadError } = await supabase.storage.from('fotos-personas').upload(path, _foto, {
    contentType: 'image/jpeg',
  })
  if (uploadError) throw uploadError
  const { data: signed } = await supabase.storage.from('fotos-personas').createSignedUrl(path, 60 * 60 * 24 * 365)
  return { ...resto, foto_url: signed?.signedUrl ?? null }
}

// Procesa la cola en lotes: intenta insertar cada pendiente en Supabase.
// Si Supabase devuelve un registro mas reciente (conflicto real), se marca
// como 'conflicto' en vez de sobreescribir silenciosamente (PRD seccion 2.4).
export async function procesarCola(supabase, { loteSize = 10 } = {}) {
  const pendientes = (await listarPendientes()).slice(0, loteSize)
  const resultados = []

  for (const item of pendientes) {
    try {
      const payload = await resolverFoto(supabase, item.datos)
      const { error } = await supabase.from(item.tabla).insert(payload)
      if (error) {
        await marcarEstado(item.localId, 'conflicto', error.message)
        resultados.push({ localId: item.localId, ok: false, error: error.message })
      } else {
        await marcarEstado(item.localId, 'sincronizado')
        resultados.push({ localId: item.localId, ok: true })
      }
    } catch (err) {
      await marcarEstado(item.localId, 'conflicto', err.message)
      resultados.push({ localId: item.localId, ok: false, error: err.message })
    }
  }

  return resultados
}
