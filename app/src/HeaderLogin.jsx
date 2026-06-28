import { useState } from 'react'
import { supabase } from './lib/supabase'

export default function HeaderLogin({ abierto, onToggle }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  if (!abierto) {
    return (
      <button
        onClick={() => onToggle(true)}
        className="rounded-md bg-brand-navy hover:bg-brand-navy-deep text-white px-4 py-1.5 text-sm font-medium transition"
      >
        Iniciar sesión
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
      <input
        type="email"
        required
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-36 rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-navy"
      />
      <input
        type="password"
        required
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-32 rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-navy"
      />
      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-brand-navy hover:bg-brand-navy-deep text-white disabled:opacity-50 px-3 py-1.5 text-sm font-medium transition"
      >
        {loading ? '…' : 'Entrar'}
      </button>
      <button
        type="button"
        onClick={() => onToggle(false)}
        className="text-gray-400 hover:text-gray-700 text-sm"
        aria-label="Cerrar"
      >
        ✕
      </button>
      {error && (
        <span className="absolute top-full mt-2 right-0 text-xs text-brand-red bg-brand-red-soft border border-red-200 rounded px-2 py-1 whitespace-nowrap">
          {error}
        </span>
      )}
    </form>
  )
}
