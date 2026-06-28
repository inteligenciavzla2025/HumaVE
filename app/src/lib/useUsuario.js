import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export function useUsuario(session) {
  const [usuario, setUsuario] = useState(undefined)

  useEffect(() => {
    if (!session) {
      setUsuario(null)
      return
    }
    let activo = true
    supabase
      .from('usuarios')
      .select('id, rol, nombre, centro_id, centros(nombre)')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!activo) return
        if (error) {
          setUsuario(null)
          return
        }
        setUsuario(data)
      })
    return () => {
      activo = false
    }
  }, [session])

  return usuario
}
