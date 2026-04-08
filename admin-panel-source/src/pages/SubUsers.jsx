import { useState, useEffect, useRef } from 'react'
import {
  collection, query, where, getDocs,
  doc, setDoc, updateDoc, deleteDoc, serverTimestamp,
} from 'firebase/firestore'
import { initializeApp, deleteApp } from 'firebase/app'
import {
  getAuth, createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth'
import { db, firebaseConfig } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import Layout from '../components/Layout'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import { getInitials, formatDate } from '../utils/formatters'
import {
  UserPlus, MoreVertical, Shield, ShieldCheck,
  Mail, Trash2, Edit2, Users, RefreshCw, Lock,
} from 'lucide-react'

// ── Constants ────────────────────────────────────────────────────────────────
const PANEL_ROLES = ['Admin', 'Staff', 'Editor']

const roleBadge = {
  'super admin': 'bg-red-100 text-red-700 border border-red-200',
  'admin':       'bg-blue-100 text-blue-700 border border-blue-200',
  'editor':      'bg-emerald-100 text-emerald-700 border border-emerald-200',
  'staff':       'bg-purple-100 text-purple-700 border border-purple-200',
}

const roleIcon = {
  'super admin': <ShieldCheck className="w-3 h-3" />,
  'admin':       <Shield className="w-3 h-3" />,
  'editor':      <Edit2 className="w-3 h-3" />,
  'staff':       <Users className="w-3 h-3" />,
}

const EMPTY_FORM = { name: '', email: '', role: 'Admin', password: '', confirmPassword: '' }

// ── Helper: create Firebase Auth user via a temporary secondary app ───────────
async function createAuthUser(email, password) {
  const secondaryAppName = `secondary-${Date.now()}`
  const secondaryApp = initializeApp(firebaseConfig, secondaryAppName)
  const secondaryAuth = getAuth(secondaryApp)
  try {
    const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password)
    return cred.user.uid
  } finally {
    await secondaryAuth.signOut()
    await deleteApp(secondaryApp)
  }
}

// ── SubUsers Page ─────────────────────────────────────────────────────────────
export default function SubUsers() {
  const { user: currentUser } = useAuth()
  const { addToast } = useToast()

  const [subUsers, setSubUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('All')

  const [showModal, setShowModal] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const [confirmDelete, setConfirmDelete] = useState(null)
  const [actionMenuId, setActionMenuId] = useState(null)
  const menuRef = useRef(null)

  // ── Load panel users from Firestore ──────────────────────────────────────
  const loadUsers = async () => {
    setLoading(true)
    try {
      const snap = await getDocs(
        query(
          collection(db, 'users'),
          where('role', 'in', ['Admin', 'Staff', 'Editor', 'Super Admin', 'super admin', 'admin', 'staff', 'editor'])
        )
      )
      const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setSubUsers(rows)
    } catch (err) {
      addToast('Failed to load users. ' + err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadUsers() }, [])

  // Close action menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setActionMenuId(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ── Derived data ──────────────────────────────────────────────────────────
  const filtered = subUsers.filter(u => {
    const roleNorm = (u.role || '').toLowerCase()
    const matchRole = roleFilter === 'All' || roleNorm === roleFilter.toLowerCase()
    const matchSearch = !searchQuery ||
      (u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchQuery.toLowerCase())
    return matchRole && matchSearch
  })

  const stats = {
    total: subUsers.length,
    admin: subUsers.filter(u => ['admin', 'super admin'].includes((u.role || '').toLowerCase())).length,
    staff: subUsers.filter(u => (u.role || '').toLowerCase() === 'staff').length,
    editor: subUsers.filter(u => (u.role || '').toLowerCase() === 'editor').length,
  }

  // ── Modal helpers ─────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditUser(null)
    setForm(EMPTY_FORM)
    setErrors({})
    setShowModal(true)
  }

  const openEdit = (u) => {
    setEditUser(u)
    setForm({ name: u.name || '', email: u.email || '', role: u.role || 'Admin', password: '', confirmPassword: '' })
    setErrors({})
    setShowModal(true)
    setActionMenuId(null)
  }

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Name is required.'
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = 'Valid email is required.'
    if (!editUser) {
      if (!form.password || form.password.length < 6)
        errs.password = 'Password must be at least 6 characters.'
      if (form.password !== form.confirmPassword)
        errs.confirmPassword = 'Passwords do not match.'
    }
    return errs
  }

  // ── Save (create or update) ───────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSaving(true)
    setErrors({})
    try {
      if (editUser) {
        // Update Firestore only
        await updateDoc(doc(db, 'users', editUser.id), {
          name: form.name.trim(),
          email: form.email.trim(),
          role: form.role,
          updatedAt: serverTimestamp(),
        })
        addToast(`${form.name} updated successfully.`, 'success')
      } else {
        // Create Firebase Auth account via secondary app + Firestore doc
        const uid = await createAuthUser(form.email.trim(), form.password)
        await setDoc(doc(db, 'users', uid), {
          name: form.name.trim(),
          email: form.email.trim(),
          role: form.role,
          status: 'Active',
          staff: true,
          verified: false,
          topListener: false,
          joined: new Date().toISOString().split('T')[0],
          createdAt: serverTimestamp(),
        })
        addToast(`${form.name} has been added as ${form.role}.`, 'success')
      }
      setShowModal(false)
      loadUsers()
    } catch (err) {
      const msg = {
        'auth/email-already-in-use': 'This email is already registered.',
        'auth/invalid-email':        'Invalid email address.',
        'auth/weak-password':        'Password is too weak (min 6 characters).',
      }[err.code] || err.message || 'Something went wrong.'
      setErrors({ general: msg })
    } finally {
      setSaving(false)
    }
  }

  // ── Send password reset email ─────────────────────────────────────────────
  const handlePasswordReset = async (u) => {
    setActionMenuId(null)
    try {
      const { auth } = await import('../firebase')
      await sendPasswordResetEmail(auth, u.email)
      addToast(`Password reset email sent to ${u.email}.`, 'success')
    } catch (err) {
      addToast('Failed to send reset email: ' + err.message, 'error')
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!confirmDelete) return
    try {
      await deleteDoc(doc(db, 'users', confirmDelete.id))
      addToast(`${confirmDelete.name} has been removed.`, 'success')
      setConfirmDelete(null)
      loadUsers()
    } catch (err) {
      addToast('Failed to delete user: ' + err.message, 'error')
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Layout
      breadcrumb={['Home', 'Sub Users']}
      searchPlaceholder="Search panel users by name or email..."
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-7 h-7 text-red-500" />
            <h2 className="text-3xl font-extrabold text-primary">Sub Users</h2>
          </div>
          <p className="text-gray-500">Manage admin panel accounts — admins, staff, and editors. Only visible to Super Admin.</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-light transition-colors"
        >
          <UserPlus className="w-4 h-4" /> Add User
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Panel Users', value: stats.total, color: 'border-t-red-400',     icon: <ShieldCheck className="w-5 h-5 text-red-400" /> },
          { label: 'Admins',            value: stats.admin,  color: 'border-t-blue-500',    icon: <Shield className="w-5 h-5 text-blue-500" /> },
          { label: 'Staff',             value: stats.staff,  color: 'border-t-purple-500',  icon: <Users className="w-5 h-5 text-purple-500" /> },
          { label: 'Editors',           value: stats.editor, color: 'border-t-emerald-500', icon: <Edit2 className="w-5 h-5 text-emerald-500" /> },
        ].map(s => (
          <div key={s.label} className={`bg-white rounded-xl border border-gray-100 border-t-3 ${s.color} p-5`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{s.label}</span>
              {s.icon}
            </div>
            <div className="text-3xl font-extrabold text-primary">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl border border-gray-100 mb-8">
        {/* Filter bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex gap-1">
            {['All', 'Admin', 'Staff', 'Editor'].map(r => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${roleFilter === r ? 'bg-accent text-white' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                {r}
              </button>
            ))}
          </div>
          <button
            onClick={loadUsers}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        {/* Table */}
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              {['USER', 'EMAIL', 'ROLE', 'JOINED', 'STATUS', 'ACTIONS'].map(h => (
                <th key={h} className="text-left px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-400">Loading users…</td></tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-400">No panel users found.</td></tr>
            )}
            {!loading && filtered.map(u => {
              const rNorm = (u.role || '').toLowerCase()
              const isSelf = u.id === currentUser?.uid
              return (
                <tr key={u.id} className={`border-b border-gray-50 hover:bg-gray-50/50 ${isSelf ? 'bg-blue-50/30' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-300 to-orange-400 flex items-center justify-center text-white text-xs font-bold select-none">
                        {getInitials(u.name || '?')}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-primary">
                          {u.name}
                          {isSelf && <span className="ml-1.5 text-[9px] font-bold uppercase bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">You</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${roleBadge[rNorm] || 'bg-gray-100 text-gray-600'}`}>
                      {roleIcon[rNorm]}
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{u.joined ? formatDate(u.joined) : '—'}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${
                      u.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-600 border border-gray-200'
                    }`}>
                      {u.status || 'Active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 relative">
                    {/* Block self-delete & self-demotion */}
                    <button
                      onClick={() => setActionMenuId(actionMenuId === u.id ? null : u.id)}
                      className="p-1 text-gray-400 hover:text-gray-600 rounded"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {actionMenuId === u.id && (
                      <div ref={menuRef} className="absolute right-6 top-10 z-30 bg-white border border-gray-200 rounded-xl shadow-lg py-1 w-48">
                        <button
                          onClick={() => openEdit(u)}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-gray-400" /> Edit Info
                        </button>
                        <button
                          onClick={() => handlePasswordReset(u)}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Lock className="w-3.5 h-3.5 text-gray-400" /> Send Password Reset
                        </button>
                        {!isSelf && (
                          <>
                            <div className="my-1 border-t border-gray-100" />
                            <button
                              onClick={() => { setConfirmDelete(u); setActionMenuId(null) }}
                              className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Remove User
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* Footer count */}
        {!loading && (
          <div className="px-6 py-3 border-t border-gray-100 text-xs text-gray-400">
            Showing {filtered.length} of {subUsers.length} panel users
          </div>
        )}
      </div>

      {/* Info banner */}
      <div className="bg-amber-50 border border-amber-100 rounded-xl p-5 flex items-start gap-4 mb-8">
        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
          <Mail className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-primary mb-1">Password Management</h4>
          <p className="text-sm text-gray-600">
            To change a user's password, use <strong>Send Password Reset</strong> — Firebase will email them a secure link to set a new password.
            You can also create new accounts with a temporary password, then have the user update it on first login.
          </p>
        </div>
      </div>

      {/* ── Create / Edit Modal ──────────────────────────────────────────── */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditUser(null) }}
        title={editUser ? 'Edit Panel User' : 'Add Panel User'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar preview */}
          <div className="flex items-center gap-4 pb-2">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-400 to-orange-500 flex items-center justify-center text-white text-lg font-bold select-none">
              {getInitials(form.name || '?')}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{form.name || 'New User'}</p>
              <span className={`inline-flex items-center gap-1 mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${roleBadge[form.role.toLowerCase()] || 'bg-gray-100 text-gray-600'}`}>
                {form.role}
              </span>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              placeholder="e.g. Sarah Johnson"
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              placeholder="user@hotfm.com"
              autoComplete="off"
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
            {editUser && (
              <p className="text-[11px] text-amber-600 mt-1">Note: updating email here updates the Firestore record. Firebase Auth login email remains unchanged.</p>
            )}
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={form.role}
              onChange={e => set('role', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent bg-white"
            >
              {PANEL_ROLES.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Password (create only) */}
          {!editUser && (
            <>
              <hr className="border-gray-100" />
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Set Temporary Password</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={e => set('password', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                    placeholder="Min 6 characters"
                    autoComplete="new-password"
                  />
                  {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                  <input
                    type="password"
                    value={form.confirmPassword}
                    onChange={e => set('confirmPassword', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                    placeholder="Repeat password"
                    autoComplete="new-password"
                  />
                  {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>}
                </div>
              </div>
              <p className="text-xs text-gray-400">After creating, you can send the user a password-reset email so they can set their own.</p>
            </>
          )}

          {/* Edit: option to send reset email */}
          {editUser && (
            <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl">
              <Lock className="w-4 h-4 text-gray-400 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">Change Password</p>
                <p className="text-xs text-gray-500">Send a password reset link to {editUser.email}</p>
              </div>
              <button
                type="button"
                onClick={() => handlePasswordReset(editUser)}
                className="text-xs font-semibold text-accent hover:underline shrink-0"
              >
                Send Reset
              </button>
            </div>
          )}

          {errors.general && (
            <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{errors.general}</p>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={() => { setShowModal(false); setEditUser(null) }}
              className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-accent text-white rounded-xl text-sm font-medium hover:bg-accent-hover disabled:opacity-60 flex items-center gap-2"
            >
              {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              {saving ? 'Saving…' : editUser ? 'Save Changes' : 'Create User'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Confirm Delete ───────────────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={!!confirmDelete}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
        title="Remove Panel User"
        message={`Are you sure you want to remove ${confirmDelete?.name}? Their Firestore record will be deleted and they will no longer be able to access the admin panel.`}
        confirmLabel="Remove"
        variant="danger"
      />
    </Layout>
  )
}
