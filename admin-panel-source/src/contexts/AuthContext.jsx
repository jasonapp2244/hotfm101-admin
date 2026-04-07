import { createContext, useContext, useState, useEffect } from 'react'
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'

const AuthContext = createContext(null)

// ── Role permissions ────────────────────────────────────────────────────────
// Normalized role → list of allowed route paths
export const ROLE_PERMISSIONS = {
  'super admin': ['*'],   // all pages
  'admin':       ['*'],   // all pages
  'editor':      ['/dashboard', '/content', '/contests', '/events'],
  'staff':       ['/dashboard', '/shoutouts', '/broadcasting'],
  'listener':    [],      // no access
}

export function canAccess(role, path) {
  const norm = (role || '').toLowerCase().trim()
  const allowed = ROLE_PERMISSIONS[norm] || []
  if (allowed.includes('*')) return true
  // match exact or prefix (e.g. /ads/analytics → /ads)
  return allowed.some(p => path === p || path.startsWith(p + '/'))
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Look up user document in users collection by Firebase Auth UID
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))

        if (userDoc.exists()) {
          const data = userDoc.data()
          const role = (data.role || '').toLowerCase().trim()

          // Block listeners — they have no admin panel access
          if (role === 'listener' || role === '') {
            await signOut(auth)
            setUser(null)
            setAuthError('Your account does not have access to this portal.')
          } else {
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              name: data.name || firebaseUser.displayName || firebaseUser.email,
              role: data.role,        // keep original casing for display
              roleNorm: role,         // normalized for permission checks
            })
          }
        } else {
          // UID not found in users collection → no access
          await signOut(auth)
          setUser(null)
          setAuthError('Your account is not registered in the system. Contact your administrator.')
        }
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const login = async (email, password) => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { success: false, error: 'Invalid email format' }
    }
    if (!password || password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters' }
    }

    try {
      await signInWithEmailAndPassword(auth, email, password)
      return { success: true }
    } catch (err) {
      const code = err?.code || ''
      const messages = {
        'auth/user-not-found':        'No account found with this email.',
        'auth/wrong-password':        'Incorrect password. Please try again.',
        'auth/invalid-credential':    'Incorrect email or password. Please try again.',
        'auth/invalid-email':         'The email address is not valid.',
        'auth/too-many-requests':     'Too many failed attempts. Please try again later.',
        'auth/user-disabled':         'This account has been disabled. Contact support.',
        'auth/network-request-failed':'Network error. Check your connection and try again.',
      }
      const message = messages[code] || 'Incorrect email or password. Please try again.'
      return { success: false, error: message }
    }
  }

  const logout = async () => {
    await signOut(auth)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, loading, authError, clearAuthError: () => setAuthError('') }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
