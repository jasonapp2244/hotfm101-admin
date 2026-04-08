import { useState, useEffect } from 'react'
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth'
import { auth } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import Modal from './Modal'
import { ShieldCheck, KeyRound, Eye, EyeOff, Info, Lock, Clock, UserCircle, BadgeCheck } from 'lucide-react'

const TABS = [
  { id: 'view',   label: 'Overview',       icon: ShieldCheck },
  { id: 'update', label: 'Change Password', icon: KeyRound },
]

export default function SecurityPrivacyModal({ isOpen, onClose }) {
  const { user } = useAuth()
  const [tab, setTab] = useState('view')

  useEffect(() => {
    if (isOpen) setTab('view')
  }, [isOpen])

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Security & Privacy" size="md">
      {/* Tab bar */}
      <div className="flex gap-1 mb-6 bg-gray-50 rounded-xl p-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
              tab === id
                ? 'bg-white text-primary shadow-sm border border-gray-100'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'view'   && <OverviewTab user={user} />}
      {tab === 'update' && <ChangePasswordTab onClose={onClose} />}
    </Modal>
  )
}

/* ── Overview Tab ─────────────────────────────────────────────── */
function OverviewTab({ user }) {
  const firebaseUser = auth.currentUser

  const rows = [
    {
      icon: UserCircle,
      label: 'Display Name',
      value: user?.name || '—',
    },
    {
      icon: Info,
      label: 'Email Address',
      value: user?.email || '—',
    },
    {
      icon: BadgeCheck,
      label: 'Role',
      value: user?.role || '—',
      badge: true,
    },
    {
      icon: Lock,
      label: 'Authentication',
      value: 'Email & Password',
    },
    {
      icon: Clock,
      label: 'Account Created',
      value: firebaseUser?.metadata?.creationTime
        ? new Date(firebaseUser.metadata.creationTime).toLocaleDateString('en-US', { dateStyle: 'medium' })
        : '—',
    },
    {
      icon: Clock,
      label: 'Last Sign-In',
      value: firebaseUser?.metadata?.lastSignInTime
        ? new Date(firebaseUser.metadata.lastSignInTime).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
        : '—',
    },
  ]

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-400 mb-4">Your current account security information.</p>
      {rows.map(({ icon: Icon, label, value, badge }) => (
        <div key={label} className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl">
          <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-gray-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">{label}</p>
            {badge ? (
              <span className="inline-block mt-0.5 px-2 py-0.5 text-xs font-semibold text-accent bg-accent/10 rounded-full capitalize">
                {value}
              </span>
            ) : (
              <p className="text-sm font-semibold text-gray-800 truncate">{value}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ── Change Password Tab ──────────────────────────────────────── */
function ChangePasswordTab({ onClose }) {
  const [form, setForm] = useState({ current: '', next: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [show, setShow] = useState({ current: false, next: false, confirm: false })

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: '' })); setSuccess('') }
  const toggleShow = (k) => setShow(p => ({ ...p, [k]: !p[k] }))

  const validate = () => {
    const e = {}
    if (!form.current) e.current = 'Current password is required.'
    if (!form.next || form.next.length < 6) e.next = 'New password must be at least 6 characters.'
    if (form.next && form.next !== form.confirm) e.confirm = 'Passwords do not match.'
    if (form.current && form.next && form.current === form.next) e.next = 'New password must differ from current password.'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSaving(true)
    setErrors({})
    try {
      const firebaseUser = auth.currentUser
      const credential = EmailAuthProvider.credential(firebaseUser.email, form.current)
      await reauthenticateWithCredential(firebaseUser, credential)
      await updatePassword(firebaseUser, form.next)
      setSuccess('Password updated successfully.')
      setForm({ current: '', next: '', confirm: '' })
    } catch (err) {
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setErrors({ current: 'Current password is incorrect.' })
      } else if (err.code === 'auth/requires-recent-login') {
        setErrors({ current: 'Please re-enter your current password to continue.' })
      } else {
        setErrors({ general: err.message || 'Something went wrong. Please try again.' })
      }
    } finally {
      setSaving(false)
    }
  }

  const fields = [
    { key: 'current', label: 'Current Password',  placeholder: 'Enter current password' },
    { key: 'next',    label: 'New Password',       placeholder: 'Min. 6 characters' },
    { key: 'confirm', label: 'Confirm New Password', placeholder: 'Repeat new password' },
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-xs text-gray-400">Enter your current password, then choose a new one.</p>

      {fields.map(({ key, label, placeholder }) => (
        <div key={key}>
          <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
          <div className="relative">
            <input
              type={show[key] ? 'text' : 'password'}
              value={form[key]}
              onChange={e => set(key, e.target.value)}
              placeholder={placeholder}
              autoComplete={key === 'current' ? 'current-password' : 'new-password'}
              className="w-full px-4 py-2.5 pr-10 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
            />
            <button
              type="button"
              onClick={() => toggleShow(key)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {show[key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors[key] && <p className="text-xs text-red-500 mt-1">{errors[key]}</p>}
        </div>
      ))}

      {errors.general && (
        <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{errors.general}</p>
      )}
      {success && (
        <p className="text-xs text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg">{success}</p>
      )}

      <div className="flex justify-end gap-3 pt-1">
        <button type="button" onClick={onClose} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2.5 bg-accent text-white rounded-xl text-sm font-medium hover:bg-accent-hover disabled:opacity-60"
        >
          {saving ? 'Updating…' : 'Update Password'}
        </button>
      </div>
    </form>
  )
}

