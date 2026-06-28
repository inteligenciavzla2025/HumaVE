import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { listarCentrosPublicos, responderConsultaPublica } from './lib/publicBotLogic'

const ChatWidget = forwardRef(function ChatWidget(_props, ref) {
  const [abierto, setAbierto] = useState(false)
  const [centros, setCentros] = useState([])
  const [mensajes, setMensajes] = useState([
    { rol: 'bot', texto: 'Pregúntame por el stock de un centro. Sin registro.' },
  ])
  const [input, setInput] = useState('')
  const [enviando, setEnviando] = useState(false)
  const inputRef = useRef(null)
  const scrollRef = useRef(null)

  useImperativeHandle(ref, () => ({
    abrir: () => setAbierto(true),
  }))

  useEffect(() => {
    listarCentrosPublicos().then(setCentros)
  }, [])

  useEffect(() => {
    if (abierto) inputRef.current?.focus()
  }, [abierto])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [mensajes])

  async function handleSubmit(e) {
    e.preventDefault()
    const texto = input.trim()
    if (!texto || enviando) return

    setMensajes((m) => [...m, { rol: 'user', texto }])
    setInput('')
    setEnviando(true)

    const respuesta = await responderConsultaPublica(texto, centros)
    setMensajes((m) => [...m, { rol: 'bot', texto: respuesta }])
    setEnviando(false)
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {abierto && (
        <div className="w-80 max-w-[calc(100vw-2.5rem)] bg-white border border-gray-200 rounded-2xl shadow-xl p-4 font-sans">
          <div className="flex items-center justify-between mb-1">
            <strong className="text-sm text-gray-900">El ayudante HumanVe</strong>
            <button
              onClick={() => setAbierto(false)}
              aria-label="Cerrar el chat"
              className="text-gray-400 hover:text-gray-700 text-sm"
            >
              ✕
            </button>
          </div>
          <p className="text-xs text-gray-500 mb-3">Pregúntame lo que sea sobre stock. Sin registro.</p>

          <div ref={scrollRef} className="max-h-56 overflow-y-auto space-y-2 mb-3">
            {mensajes.map((m, i) => (
              <div key={i} className={`flex ${m.rol === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-1.5 text-xs ${
                    m.rol === 'user' ? 'bg-brand-navy text-white' : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {m.texto}
                </div>
              </div>
            ))}
            {enviando && <div className="text-gray-400 text-xs">Buscando…</div>}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ej: ¿hay agua en el Refugio Petare?"
              className="border border-gray-300 rounded-full px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-navy"
            />
            <button
              type="submit"
              className="bg-brand-navy hover:bg-brand-navy-deep text-white rounded-full py-2 text-xs font-semibold transition"
            >
              Preguntar
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setAbierto((v) => !v)}
        aria-label="Abrir el ayudante HumanVe"
        className="w-14 h-14 rounded-full bg-brand-navy hover:bg-brand-navy-deep text-white text-2xl flex items-center justify-center shadow-lg"
      >
        🤖
      </button>
    </div>
  )
})

export default ChatWidget
