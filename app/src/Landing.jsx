import HeaderLogin from './HeaderLogin'

const MODULOS = [
  { titulo: 'Personas', desc: 'Registro y búsqueda de personas desaparecidas, con foto y consentimiento.' },
  { titulo: 'Inventario', desc: 'Control de stock en centros de acopio, con alertas automáticas.' },
  { titulo: 'Aforo', desc: 'Check-in y check-out en refugios, hospitales y clínicas, en tiempo real.' },
  { titulo: 'Envíos', desc: 'Actas digitales de envío entre centros, compartibles por WhatsApp.' },
]

export default function Landing() {
  return (
    <div className="min-h-svh bg-slate-900 text-white flex flex-col">
      <header className="relative flex items-center justify-between px-4 sm:px-8 py-4 border-b border-slate-800">
        <span className="font-semibold text-lg">HumaVE</span>
        <HeaderLogin />
      </header>

      <main className="flex-1">
        <section className="px-4 sm:px-8 py-16 sm:py-24 max-w-3xl mx-auto text-center">
          <h1 className="text-3xl sm:text-5xl font-bold mb-4">
            Sistema Nacional de Respuesta Humanitaria
          </h1>
          <p className="text-slate-400 text-lg mb-8">
            Una herramienta offline-first para que voluntarios, operadores y coordinadores
            registren personas y gestionen recursos en centros de acopio, refugios, hospitales
            y clínicas en Venezuela — incluso sin conexión a internet.
          </p>
          <a
            href="/bot-publico"
            className="inline-block rounded-md bg-green-600 hover:bg-green-500 px-6 py-3 text-sm font-medium transition"
          >
            Consultar stock de un centro (sin cuenta)
          </a>
        </section>

        <section className="px-4 sm:px-8 pb-16 sm:pb-24 max-w-4xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {MODULOS.map((m) => (
              <div key={m.titulo} className="rounded-lg bg-slate-800 border border-slate-700 p-5">
                <h2 className="font-semibold mb-1">{m.titulo}</h2>
                <p className="text-sm text-slate-400">{m.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="px-4 sm:px-8 py-4 border-t border-slate-800 text-center text-xs text-slate-500">
        HumaVE — Equipo InteligencIA / Coordinación Humanitaria
      </footer>
    </div>
  )
}
