import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext<any>(null)
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: any) {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1. Checa sesión inicial
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null)
      setLoading(false)
    })

    // 2. Escucha cambios de Google
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('AUTH EVENT:', _event, session?.user?.email)
      setUser(session?.user || null)
      setLoading(false)
      
      if (session?.user) {
        try {
          const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
          setProfile(data || null)
        } catch (e) {
          console.log('No hay tabla profiles, no importa', e)
          setProfile(null)
        }
      } else {
        setProfile(null)
      }
    })

    return () => sub.subscription.unsubscribe()
  }, [])

  const loginGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ 
      provider: 'google', 
      options: { 
        redirectTo: 'http://localhost:5174/app',
        queryParams: { prompt: 'select_account' }
      } 
    })
    if (error) alert('Error Google: ' + error.message)
  }

  const loginEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      const { error: err2 } = await supabase.auth.signUp({ email, password })
      if (err2) alert(err2.message)
      else alert('Cuenta creada, ahora inicia sesión de nuevo')
    }
  }

  const logout = async () => { 
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  return <AuthContext.Provider value={{ user, profile, loginGoogle, loginEmail, logout, loading }}>{children}</AuthContext.Provider>
}