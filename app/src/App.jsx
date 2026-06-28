import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import Login from './Login'
import Shell from './Shell'

function App() {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  if (session === undefined) {
    return (
      <div className="min-h-svh flex items-center justify-center bg-slate-900 text-white">
        <p className="text-slate-400 text-sm">Cargando…</p>
      </div>
    )
  }

  if (!session) {
    return <Login />
  }

  return <Shell session={session} />
}

export default App
