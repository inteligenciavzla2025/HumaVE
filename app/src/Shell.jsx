import { useState } from 'react'
import { supabase } from './lib/supabase'
import { useUsuario } from './lib/useUsuario'
import { useOnlineSync } from './lib/useOnlineSync'
import Menu from './Menu'
import Bot from './Bot'
import Personas from './Personas'
import Buscar from './Buscar'
import Inventario from './Inventario'
import Aforo from './Aforo'
import Envios from './Envios'

const VISTAS = {
  personas: Personas,
  buscar: Buscar,
  inventario: Inventario,
  aforo: Aforo,
  envios: Envios,
  bot: Bot,
}

export default function Shell({ session }) {
  const usuario = useUsuario(session)
  const { pendientes, sincronizando } = useOnlineSync()
  const [vista, setVista] = useState('menu')

  const Vista = VISTAS[vista]

  return (
    <div className="min-h-svh flex flex-col bg-slate-900 text-white">
      <header className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          {vista !== 'menu' && (
            <button onClick={() => setVista('menu')} className="text-slate-400 hover:text-white text-sm">
              ← Menú
            </button>
          )}
          <img src="/logo.png" alt="HumanVe" className="h-7 w-7 rounded" />
          <h1 className="font-semibold">HumanVe</h1>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span title={pendientes > 0 ? `${pendientes} pendiente(s) de sincronizar` : 'Todo sincronizado'}>
            {sincronizando ? '🔄' : pendientes > 0 ? `☁️ ${pendientes}` : '☁️✓'}
          </span>
          {usuario?.centros?.nombre && <span>{usuario.centros.nombre}</span>}
          {usuario?.rol && <span className="capitalize">{usuario.rol}</span>}
          <button onClick={() => supabase.auth.signOut()} className="hover:text-white">
            Salir
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        {vista === 'menu' ? (
          <Menu onNavigate={setVista} />
        ) : (
          <Vista usuario={usuario} onLogout={() => supabase.auth.signOut()} />
        )}
      </main>
    </div>
  )
}
