import { useState, useEffect } from 'react'
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth'
import { doc, updateDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import Modal from './Modal'
import { validateRequired, validateMinLength } from '../utils/validators'

export default function EditProfileModal({ isOpen, onClose }) {
  const { user, updateUserData } = useAuth()

  const [form, setForm] = useState({ name: '', currentPassword: '', newPassword: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    if (isOpen) {
      setForm({ name: user?.name || '', currentPassword: '', newPassword: '', confirmPassword: '' })
      setErrors({})
      setSuccessMsg('')
    }
  }, [isOpen, user])

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  const validate = () => {
    const errs = {}
    const nameErr = validateRequired(form.name, 'Name')
    if (nameErr) errs.name = nameErr

    const changingPassword = form.newPassword || form.confirmPassword || form.currentPassword

    if (changingPassword) {
      const curErr = validateRequired(form.currentPassword, 'Current password')
      if (curErr) errs.currentPassword = curErr

      const newErr = validateMinLength(form.newPassword, 6, 'New password')
      if (newErr) errs.newPassword = newErr

      if (form.newPassword && form.newPassword !== form.confirmPassword) {
        errs.confirmPassword = 'Passwords do not match'
      }
    }

    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSaving(true)
    setErrors({})
    setSuccessMsg('')

    try {
      const firebaseUser = auth.currentUser

      // Update name in Firestore
      if (form.name.trim() !== user?.name) {
        await updateDoc(doc(db, 'users', firebaseUser.uid), { name: form.name.trim() })
        updateUserData({ name: form.name.trim() })
      }

      // Update password if requested
      if (form.newPassword) {
        const credential = EmailAuthProvider.credential(firebaseUser.email, form.currentPassword)
        await reauthenticateWithCredential(firebaseUser, credential)
        await updatePassword(firebaseUser, form.newPassword)
      }

      setSuccessMsg('Profile updated successfully.')
      setForm(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }))
    } catch (err) {
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setErrors({ currentPassword: 'Current password is incorrect.' })
      } else if (err.code === 'auth/requires-recent-login') {
        setErrors({ currentPassword: 'Please re-enter your current password to change it.' })
      } else {
        setErrors({ general: err.message || 'Something went wrong. Please try again.' })
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Profile">
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Avatar preview */}
        <div className="flex items-center gap-4 pb-2">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-lg font-bold select-none">
            {(form.name || user?.name || 'A').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{form.name || user?.name}</p>
            <p className="text-xs text-gray-500">{user?.email}</p>
            <span className="inline-block mt-1 px-2 py-0.5 text-xs font-semibold text-accent bg-accent/10 rounded-full capitalize">
              {user?.role}
            </span>
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
          <input
            type="text"
            value={form.name}
            onChange={e => set('name', e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
            placeholder="Your full name"
          />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
        </div>

        {/* Email (read-only) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={user?.email || ''}
            disabled
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
          />
        </div>

        <hr className="border-gray-100" />
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Change Password (optional)</p>

        {/* Current password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
          <input
            type="password"
            value={form.currentPassword}
            onChange={e => set('currentPassword', e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
            placeholder="Required to change password"
            autoComplete="current-password"
          />
          {errors.currentPassword && <p className="text-xs text-red-500 mt-1">{errors.currentPassword}</p>}
        </div>

        {/* New password */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input
              type="password"
              value={form.newPassword}
              onChange={e => set('newPassword', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              placeholder="Min 6 characters"
              autoComplete="new-password"
            />
            {errors.newPassword && <p className="text-xs text-red-500 mt-1">{errors.newPassword}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={e => set('confirmPassword', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              placeholder="Repeat new password"
              autoComplete="new-password"
            />
            {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>}
          </div>
        </div>

        {errors.general && (
          <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{errors.general}</p>
        )}
        {successMsg && (
          <p className="text-xs text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg">{successMsg}</p>
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
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
