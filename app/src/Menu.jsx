const BOTONES = [
  { id: 'personas', label: 'Personas', desc: 'Registrar persona' },
  { id: 'buscar', label: 'Buscar', desc: 'Buscar desaparecido' },
  { id: 'inventario', label: 'Inventario', desc: 'Stock del centro' },
  { id: 'aforo', label: 'Aforo', desc: 'Check-in / Check-out' },
  { id: 'envios', label: 'Envíos', desc: 'Acta de envío' },
  { id: 'bot', label: 'Bot de stock', desc: 'Preguntar por chat' },
]

export default function Menu({ onNavigate }) {
  return (
    <div className="grid grid-cols-2 gap-3 p-4">
      {BOTONES.map((b) => (
        <button
          key={b.id}
          onClick={() => onNavigate(b.id)}
          className="flex flex-col items-start rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 p-4 text-left transition"
        >
          <span className="font-semibold">{b.label}</span>
          <span className="text-xs text-slate-400 mt-1">{b.desc}</span>
        </button>
      ))}
    </div>
  )
}
