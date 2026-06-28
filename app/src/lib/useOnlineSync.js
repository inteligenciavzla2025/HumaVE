import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'
import { contarPendientes, procesarCola } from './syncQueue'

export function useOnlineSync() {
  const [pendientes, setPendientes] = useState(0)
  const [sincronizando, setSincronizando] = useState(false)

  const sync = useCallback(async () => {
    const restantesAntes = await contarPendientes()
    setPendientes(restantesAntes)
    if (restantesAntes === 0 || !navigator.onLine) return

    setSincronizando(true)
    await procesarCola(supabase)
    setPendientes(await contarPendientes())
    setSincronizando(false)
  }, [])

  useEffect(() => {
    sync()
    window.addEventListener('online', sync)
    const interval = setInterval(sync, 30000)
    return () => {
      window.removeEventListener('online', sync)
      clearInterval(interval)
    }
  }, [sync])

  return { pendientes, sincronizando, sync }
}
