import { useState, useEffect } from 'react'
import Modal from './Modal'
import { validateEmail, validateRequired } from '../utils/validators'

export default function UserModal({ isOpen, onClose, onSubmit, user }) {
  const [form, setForm] = useState({ name: '', email: '', role: 'Listener', status: 'Active' })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (user) setForm({ name: user.name, email: user.email, role: user.role, status: user.status })
    else setForm({ name: '', email: '', role: 'Listener', status: 'Active' })
    setErrors({})
  }, [user, isOpen])

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = {}
    const nameErr = validateRequired(form.name, 'Name')
    const emailErr = validateEmail(form.email)
    if (nameErr) errs.name = nameErr
    if (emailErr) errs.email = emailErr
    if (Object.keys(errs).length) { setErrors(errs); return }
    onSubmit(form)
  }

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={user ? 'Edit User' : 'Invite User'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input type="text" value={form.name} onChange={e => set('name', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent" placeholder="Full name" />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input type="email" value={form.email} onChange={e => set('email', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent" placeholder="name@example.com" />
          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select value={form.role} onChange={e => set('role', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none">
              {['Listener', 'Editor', 'Staff', 'Admin'].map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none">
              {['Active', 'Disabled', 'Pending'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button type="submit" className="px-5 py-2.5 bg-accent text-white rounded-xl text-sm font-medium hover:bg-accent-hover">{user ? 'Save Changes' : 'Invite User'}</button>
        </div>
      </form>
    </Modal>
  )
}
