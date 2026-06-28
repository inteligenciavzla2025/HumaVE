import { useState } from 'react'
import { supabase } from './lib/supabase'

export default function HeaderLogin() {
  const [abierto, setAbierto] = useState(false)
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
        onClick={() => setAbierto(true)}
        className="rounded-md bg-brand-navy hover:bg-brand-blue px-4 py-1.5 text-sm font-medium transition"
      >
        Iniciar sesión
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        type="email"
        required
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-36 rounded-md bg-slate-800 border border-slate-700 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
      />
      <input
        type="password"
        required
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-32 rounded-md bg-slate-800 border border-slate-700 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
      />
      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-brand-navy hover:bg-brand-blue disabled:opacity-50 px-3 py-1.5 text-sm font-medium transition"
      >
        {loading ? '…' : 'Entrar'}
      </button>
      <button
        type="button"
        onClick={() => setAbierto(false)}
        className="text-slate-500 hover:text-white text-sm"
      >
        ✕
      </button>
      {error && (
        <span className="absolute mt-12 right-4 text-red-400 text-xs bg-slate-900 border border-red-900 rounded px-2 py-1">
          {error}
        </span>
      )}
    </form>
  )
}
