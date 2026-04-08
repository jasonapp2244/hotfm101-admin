import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { Mail, Lock, EyeOff, Eye, Radio, AlertCircle, X } from 'lucide-react'

const FIREBASE_ERRORS = {
  'auth/user-not-found':         'No account found with this email address.',
  'auth/wrong-password':         'Incorrect password. Please try again.',
  'auth/invalid-credential':     'Incorrect email or password. Please try again.',
  'auth/invalid-email':          'The email address is not valid.',
  'auth/too-many-requests':      'Too many failed attempts. Please try again later.',
  'auth/user-disabled':          'This account has been disabled. Contact support.',
  'auth/network-request-failed': 'Network error. Please check your connection.',
}

export default function Login() {
  const [email,         setEmail]         = useState('')
  const [password,      setPassword]      = useState('')
  const [showPassword,  setShowPassword]  = useState(false)
  const [error,         setError]         = useState('')
  const [errorKey,      setErrorKey]      = useState(0)
  const [emailError,    setEmailError]    = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [loading,       setLoading]       = useState(false)

  const { isAuthenticated, authError, clearAuthError } = useAuth()

  useEffect(() => {
    if (authError) {
      setError(authError)
      setErrorKey(k => k + 1)
      clearAuthError()
    }
  }, [authError, clearAuthError])

  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  const showError = (msg) => {
    setError(msg)
    setErrorKey(k => k + 1)
  }

  const validateFields = () => {
    let valid = true
    if (!email.trim()) {
      setEmailError('Email is required.')
      valid = false
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Please enter a valid email address.')
      valid = false
    } else {
      setEmailError('')
    }
    if (!password) {
      setPasswordError('Password is required.')
      valid = false
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters.')
      valid = false
    } else {
      setPasswordError('')
    }
    return valid
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!validateFields()) return
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (err) {
      const msg = FIREBASE_ERRORS[err?.code] || 'Incorrect email or password. Please try again.'
      showError(msg)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="fixed top-0 right-0 w-[600px] h-[400px] bg-gradient-to-bl from-blue-100/60 via-indigo-50/40 to-transparent rounded-bl-[100px] pointer-events-none" />

      <div className="w-full max-w-[1100px] flex items-center justify-between gap-16 relative z-10">
        {/* Left branding */}
        <div className="hidden lg:flex flex-col gap-8 max-w-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
              <Radio className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-primary">Hot FM 101.5</span>
          </div>
          <h1 className="text-5xl font-extrabold text-primary leading-tight">
            Master your<br />
            <span className="text-accent">broadcast identity.</span>
          </h1>
          <p className="text-gray-500 text-lg leading-relaxed">
            The centralized editorial hub for Hot 101.5.
            Streamline production, monitor analytics, and
            engage your audience in real-time.
          </p>
          <div className="flex gap-10 mt-2">
            <div>
              <div className="text-3xl font-extrabold text-primary">24/7</div>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest mt-1">Uptime</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-primary">99.9%</div>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest mt-1">Reliability</div>
            </div>
          </div>
        </div>

        {/* Login card */}
        <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 p-8 lg:p-10">
          <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
          <p className="text-gray-500 mt-1 mb-8">Please enter your credentials to access the hub.</p>

          {error && (
            <div
              key={errorKey}
              className="mb-6 flex items-start gap-3 px-4 py-4 bg-red-600 rounded-xl shadow-md shadow-red-200 animate-shake"
            >
              <AlertCircle className="w-5 h-5 text-white shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">Login Failed</p>
                <p className="text-xs text-red-100 mt-0.5">{error}</p>
              </div>
              <button
                type="button"
                onClick={() => setError('')}
                className="text-red-200 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Work Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="name@hot1015.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setEmailError('') }}
                  className={`w-full pl-11 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all placeholder:text-gray-400 ${emailError ? 'border-red-400 focus:ring-red-200 focus:border-red-400' : 'border-gray-200 focus:ring-accent/20 focus:border-accent'}`}
                />
              </div>
              {emailError && <p className="mt-1.5 text-xs text-red-600">{emailError}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setPasswordError('') }}
                  className={`w-full pl-11 pr-11 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all placeholder:text-gray-400 ${passwordError ? 'border-red-400 focus:ring-red-200 focus:border-red-400' : 'border-gray-200 focus:ring-accent/20 focus:border-accent'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <Eye className="w-4.5 h-4.5" /> : <EyeOff className="w-4.5 h-4.5" />}
                </button>
              </div>
              {passwordError && <p className="mt-1.5 text-xs text-red-600">{passwordError}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent hover:bg-accent-hover text-white font-semibold py-3 rounded-xl transition-colors text-sm cursor-pointer disabled:opacity-60"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-xs text-gray-400">Access restricted to authorized Hot 101.5 personnel.</p>
            <p className="text-xs text-gray-400 mt-1">&copy; 2024 Sonic Editorial Hub. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
