import { createContext, useContext, useEffect, useState } from 'react'
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth'
import type { User } from 'firebase/auth'
import { auth, googleProvider } from '../lib/firebase'

const AuthContext = createContext<any>(null)
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: any) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('AUTH EVENT FIREBASE:', firebaseUser?.email)
      setUser(firebaseUser)
      setLoading(false)
      
      if (firebaseUser) {
        setProfile({
          id: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName,
          avatar: firebaseUser.photoURL
        })
      } else {
        setProfile(null)
      }
    })

    return () => unsubscribe()
  }, [])

  const loginGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider)
      console.log('Login OK:', result.user.email)
    } catch (error: any) {
      console.error(error)
      alert('Error Google: ' + error.message)
    }
  }

  const loginEmail = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (error: any) {
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        try {
          await createUserWithEmailAndPassword(auth, email, password)
          alert('Cuenta creada con Firebase')
        } catch (err2: any) {
          alert(err2.message)
        }
      } else {
        alert(error.message)
      }
    }
  }

  const logout = async () => { 
    await signOut(auth)
    setUser(null)
    setProfile(null)
  }

  return <AuthContext.Provider value={{ user, profile, loginGoogle, loginEmail, logout, loading }}>{children}</AuthContext.Provider>
}