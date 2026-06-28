import { useEffect, useRef, useState } from 'react'
import { supabase } from './lib/supabase'
import HeaderLogin from './HeaderLogin'
import ChatWidget from './ChatWidget'

const MODULOS = [
  {
    titulo: 'Registro de personas',
    resumen: 'Datos básicos, foto y consentimiento, en menos de dos minutos por persona.',
    detalle: 'La foto se comprime automáticamente y el consentimiento queda guardado con fecha y hora exacta.',
  },
  {
    titulo: 'Control de inventario',
    resumen: 'Entradas, salidas y alertas automáticas cuando algo se está acabando.',
    detalle: 'Cada movimiento actualiza el stock al instante, con alerta visual si baja del mínimo configurado.',
  },
  {
    titulo: 'Control de aforo',
    resumen: 'Check-in y check-out en tiempo real, con alertas de cupo.',
    detalle: 'Bloquea el doble check-in por error y muestra el aforo con semáforo de colores.',
  },
  {
    titulo: 'Reportes automáticos',
    resumen: 'El resumen del día, listo para mandarle a las organizaciones aliadas.',
    detalle: 'Se manda todas las noches a una hoja de Google Sheets, sin nombres ni fotos — solo totales.',
  },
]

function Logo({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="20" r="18" fill="none" stroke="#1A3A5C" strokeWidth="2" />
      <circle cx="13" cy="22" r="3.4" fill="#C9910A" />
      <circle cx="20" cy="16" r="3.4" fill="#1A3A5C" />
      <circle cx="27" cy="22" r="3.4" fill="#B03020" />
      <path d="M13 22 L20 16 L27 22" stroke="#1A3A5C" strokeWidth="1.4" fill="none" strokeLinecap="round" />
    </svg>
  )
}

function useEstadisticasPublicas() {
  const [valores, setValores] = useState({ personas: 0, centros: 0, movimientos: 0 })
  const targetRef = useRef({ personas: 0, centros: 0, movimientos: 0 })
  const displayRef = useRef({ personas: 0, centros: 0, movimientos: 0 })

  useEffect(() => {
    let activo = true

    function animar(desdeCero) {
      const desde = desdeCero ? { personas: 0, centros: 0, movimientos: 0 } : { ...displayRef.current }
      const hasta = targetRef.current
      const duracion = desdeCero ? 1800 : 800
      const inicio = performance.now()
      function paso(ahora) {
        const progreso = Math.min((ahora - inicio) / duracion, 1)
        const actual = {
          personas: Math.round(desde.personas + (hasta.personas - desde.personas) * progreso),
          centros: Math.round(desde.centros + (hasta.centros - desde.centros) * progreso),
          movimientos: Math.round(desde.movimientos + (hasta.movimientos - desde.movimientos) * progreso),
        }
        displayRef.current = actual
        setValores(actual)
        if (progreso < 1) requestAnimationFrame(paso)
      }
      requestAnimationFrame(paso)
    }

    async function cargar(primera) {
      const { data, error } = await supabase.rpc('estadisticas_publicas')
      if (error || !data?.[0] || !activo) return
      targetRef.current = {
        personas: Number(data[0].personas_registradas) || 0,
        centros: Number(data[0].centros_activos) || 0,
        movimientos: Number(data[0].movimientos_hoy) || 0,
      }
      animar(primera)
    }

    cargar(true)
    const interval = setInterval(() => cargar(false), 60000)
    return () => {
      activo = false
      clearInterval(interval)
    }
  }, [])

  return valores
}

export default function Landing() {
  const [loginAbierto, setLoginAbierto] = useState(false)
  const [orgAbierta, setOrgAbierta] = useState(null)
  const chatRef = useRef(null)
  const stats = useEstadisticasPublicas()

  function abrirLogin() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setLoginAbierto(true)
  }

  function abrirChat() {
    chatRef.current?.abrir()
  }

  function scrollA(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="min-h-svh bg-white text-gray-700 font-sans flex flex-col">
      <div className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-2 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse" />
          <span className="font-num">Sistema activo</span>
          <span>· {stats.centros} centros piloto operando en Venezuela · Acceso gratuito, sin registro</span>
        </div>
      </div>

      <div
        className="h-1 w-full"
        style={{ background: 'linear-gradient(to right, #C9910A 0 33.33%, #1A3A5C 33.33% 66.66%, #B03020 66.66% 100%)' }}
      />

      <header className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size={40} />
            <div>
              <h2 className="font-display text-xl text-gray-900 m-0">
                <span className="text-brand-navy">Human</span>
                <span className="text-brand-gold">Ve</span>
              </h2>
              <p className="text-xs text-gray-500 m-0">Apoyo Social a Venezuela</p>
            </div>
          </div>
          <div className="flex items-center gap-7">
            <button onClick={() => scrollA('como-funciona')} className="hidden sm:inline text-sm font-medium text-gray-700 hover:text-brand-navy">
              Cómo funciona
            </button>
            <button onClick={() => scrollA('stats')} className="hidden sm:inline text-sm font-medium text-gray-700 hover:text-brand-navy">
              Centros activos
            </button>
            <HeaderLogin abierto={loginAbierto} onToggle={setLoginAbierto} />
            <button
              onClick={abrirChat}
              className="rounded-full bg-brand-red hover:bg-red-800 text-white px-4 py-1.5 text-sm font-semibold transition"
            >
              🆘 Emergencia
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="px-4 sm:px-8 py-16 sm:py-20 text-center">
          <span className="inline-block text-xs font-semibold text-brand-navy bg-gray-50 border border-gray-100 rounded-full px-4 py-1.5 mb-5">
            Acceso público y gratis · Sin registro
          </span>
          <h1 className="font-display text-3xl sm:text-5xl text-gray-900 max-w-3xl mx-auto mb-4">
            ¿Buscas a alguien o te urge una mano? Empieza por aquí
          </h1>
          <p className="text-gray-500 text-lg max-w-xl mx-auto leading-relaxed">
            HumanVe conecta a familias, voluntarios y centros de acopio en toda Venezuela. No tienes que registrarte
            para buscar a una persona, ver el stock o saber qué centros están activos.
          </p>
        </section>

        <div className="max-w-5xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-16">
            <button
              onClick={abrirLogin}
              className="relative text-left rounded-2xl p-6 bg-brand-navy hover:-translate-y-0.5 transition"
            >
              <span className="absolute top-4 right-4 text-[11px] font-semibold bg-white/15 text-white rounded-full px-2.5 py-1">
                Más usado
              </span>
              <span className="text-2xl block mb-3">🔍</span>
              <h3 className="font-semibold text-white text-lg mb-1">Buscar persona</h3>
              <p className="text-sm text-blue-100 mb-4">Consigue a alguien registrado en algún centro del país.</p>
              <span className="text-sm font-semibold text-white">→ Iniciar sesión para buscar</span>
            </button>

            <button
              onClick={abrirLogin}
              className="relative text-left rounded-2xl p-6 bg-brand-gold-soft hover:-translate-y-0.5 transition"
            >
              <span className="absolute top-4 right-4 text-[11px] font-semibold bg-brand-gold text-white rounded-full px-2.5 py-1">
                En vivo
              </span>
              <span className="text-2xl block mb-3">📊</span>
              <h3 className="font-semibold text-[#7A5A06] text-lg mb-1">Consultar aforo</h3>
              <p className="text-sm text-[#93720F] mb-4">Mira cuánta gente hay ahorita en cada refugio o centro.</p>
              <span className="text-sm font-semibold text-[#7A5A06]">→ Iniciar sesión para ver aforo</span>
            </button>

            <button
              onClick={abrirChat}
              className="relative text-left rounded-2xl p-6 bg-brand-green-soft hover:-translate-y-0.5 transition"
            >
              <span className="text-2xl block mb-3">📦</span>
              <h3 className="font-semibold text-brand-green text-lg mb-1">Consultar stock</h3>
              <p className="text-sm text-[#4F7C5C] mb-4">Échale un ojo a qué tiene disponible un centro de acopio.</p>
              <span className="text-sm font-semibold text-brand-green">→ Preguntarle al ayudante</span>
            </button>

            <div className="relative text-left rounded-2xl p-6 bg-brand-red-soft opacity-80">
              <span className="absolute top-4 right-4 text-[11px] font-semibold bg-brand-red text-white rounded-full px-2.5 py-1">
                Próximamente
              </span>
              <span className="text-2xl block mb-3">📍</span>
              <h3 className="font-semibold text-brand-red text-lg mb-1">Reportar desaparecido</h3>
              <p className="text-sm text-[#A35248]">Avísale a la red de centros sobre alguien que no consigues.</p>
            </div>
          </div>

          <div id="stats" className="border border-gray-100 rounded-2xl p-9 mb-16 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            <div>
              <div className="font-num text-3xl text-brand-navy">{stats.personas.toLocaleString('es-VE')}</div>
              <div className="text-xs text-gray-500 mt-1.5">Personas registradas</div>
            </div>
            <div>
              <div className="font-num text-3xl text-brand-navy">{stats.centros.toLocaleString('es-VE')}</div>
              <div className="text-xs text-gray-500 mt-1.5">Centros activos</div>
            </div>
            <div>
              <div className="font-num text-3xl text-brand-navy">{stats.movimientos.toLocaleString('es-VE')}</div>
              <div className="text-xs text-gray-500 mt-1.5">Movimientos registrados hoy</div>
            </div>
          </div>
        </div>

        <section id="como-funciona" className="px-4 sm:px-8 py-16">
          <div className="max-w-5xl mx-auto">
            <h2 className="font-display text-3xl text-gray-900 text-center mb-12">Así de fácil, en serio</h2>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 mb-10">
              {[
                ['Escoges qué necesitas', 'Buscar a alguien, ver stock, el aforo o reportar algo.'],
                ['Escribes lo que sabes', 'Un nombre, un centro, una zona. Con eso basta.'],
                ['Ves los resultados', 'La info te sale de una vez, clarita.'],
                ['Te contactas con el centro', 'Si hace falta seguir el caso, te decimos cómo llegar a ellos.'],
              ].map(([titulo, desc], i) => (
                <div key={titulo}>
                  <div className="w-9 h-9 rounded-full bg-brand-gold text-white font-num flex items-center justify-center mb-3.5">
                    {i + 1}
                  </div>
                  <h3 className="font-semibold text-gray-900 text-base mb-1.5">{titulo}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>

            <div className="bg-brand-navy rounded-2xl p-7 flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-white font-semibold mb-1">Funciona aunque no haya señal</h3>
                <p className="text-blue-100 text-sm">Los voluntarios en el terreno pueden seguir registrando aunque no haya internet.</p>
              </div>
              <div className="flex gap-2.5 flex-wrap">
                {['Android 8+', 'iPhone iOS 14+', 'Sin instalación'].map((tag) => (
                  <span key={tag} className="text-xs font-medium bg-white/10 border border-white/20 text-white rounded-full px-3.5 py-1.5">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 sm:px-8 py-16 max-w-2xl mx-auto">
          <h2 className="font-display text-3xl text-gray-900 mb-2">Por qué existe HumanVe</h2>
          <h3 className="font-sans font-medium text-base text-brand-navy mb-5">Detrás de cada registro hay una familia</h3>
          <p className="text-[15px] text-gray-700 leading-relaxed mb-6">
            Esto arrancó como una manera sencilla de no perder papeles en medio de una emergencia. Hoy es cómo
            voluntarios y coordinadores en distintos puntos del país saben, en minutos, si alguien fue visto, si un
            centro tiene cupo, o si falta algo en el inventario. No hace falta entender de tecnología para usarlo —
            solo escribes lo que ya sabes.
          </p>
          <button onClick={abrirLogin} className="rounded-md bg-brand-navy hover:bg-brand-navy-deep text-white px-5 py-2.5 text-sm font-medium transition">
            Buscar persona ya
          </button>
        </section>

        <section className="bg-gray-50 px-4 sm:px-8 py-16">
          <div className="max-w-5xl mx-auto">
            <h2 className="font-display text-3xl text-gray-900 text-center mb-12">¿Llevas un centro o un grupo de voluntarios?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {MODULOS.map((m, i) => (
                <div key={m.titulo} className="bg-white border border-gray-100 rounded-2xl p-6">
                  <h3 className="font-semibold text-gray-900 text-base mb-2">{m.titulo}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed mb-1">{m.resumen}</p>
                  {orgAbierta === i && <p className="text-sm text-gray-500 leading-relaxed mb-3">{m.detalle}</p>}
                  <button
                    onClick={() => setOrgAbierta(orgAbierta === i ? null : i)}
                    className="text-sm font-semibold text-brand-navy"
                  >
                    {orgAbierta === i ? '← Ver menos' : 'Saber más →'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-gray-100 px-4 sm:px-8 py-16 text-center">
          <h2 className="font-display text-3xl text-gray-900 mb-3">¿Quieres meter a tu centro en este proyecto?</h2>
          <p className="text-gray-500 text-[15px] max-w-md mx-auto">
            Si llevas un refugio, comedor o punto de acopio, te ayudamos a empezar.
          </p>
          <div className="flex gap-3.5 justify-center flex-wrap mt-5">
            <a
              href="mailto:inteligenciavzla2025@gmail.com?subject=Quiero%20sumar%20mi%20centro%20a%20HumanVe"
              className="rounded-md bg-brand-navy hover:bg-brand-navy-deep text-white px-5 py-2.5 text-sm font-medium transition"
            >
              Meter mi centro ↗
            </a>
            <button
              onClick={() => scrollA('como-funciona')}
              className="rounded-md border border-gray-300 hover:border-brand-navy text-gray-900 px-5 py-2.5 text-sm font-medium transition"
            >
              Ver cómo se usa
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-4">Gratis para organizaciones humanitarias, así de sencillo. Sin letra pequeña.</p>
        </section>
      </main>

      <footer className="border-t border-gray-100 py-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-1.5">
          <Logo size={26} />
          <h2 className="font-display text-base text-gray-900 m-0">
            <span className="text-brand-navy">Human</span>
            <span className="text-brand-gold">Ve</span>
          </h2>
        </div>
        <p className="text-xs text-gray-500">Apoyo Social a Venezuela · 2026 · Acceso público y gratuito</p>
      </footer>

      <ChatWidget ref={chatRef} />
    </div>
  )
}
