import { useState, useEffect } from 'react'
import Modal from './Modal'
import { validateRequired } from '../utils/validators'

export default function ContestModal({ isOpen, onClose, onSubmit, contest }) {
  const [form, setForm] = useState({ name: '', prize: '', value: '', start: '', end: '', status: 'Active' })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (contest) setForm({ name: contest.name, prize: contest.prize, value: String(contest.value), start: contest.start, end: contest.end, status: contest.status })
    else setForm({ name: '', prize: '', value: '', start: '', end: '', status: 'Active' })
    setErrors({})
  }, [contest, isOpen])

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = {}
    if (validateRequired(form.name, 'Name')) errs.name = validateRequired(form.name, 'Name')
    if (validateRequired(form.prize, 'Prize')) errs.prize = validateRequired(form.prize, 'Prize')
    if (Object.keys(errs).length) { setErrors(errs); return }
    onSubmit({ ...form, value: Number(form.value) || 0 })
  }

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={contest ? 'Edit Contest' : 'Create New Contest'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Contest Name</label>
          <input type="text" value={form.name} onChange={e => set('name', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent" />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Prize Description</label>
          <input type="text" value={form.prize} onChange={e => set('prize', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent" />
          {errors.prize && <p className="text-xs text-red-500 mt-1">{errors.prize}</p>}
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Est. Value ($)</label>
            <input type="number" value={form.value} onChange={e => set('value', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input type="date" value={form.start} onChange={e => set('start', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input type="date" value={form.end} onChange={e => set('end', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select value={form.status} onChange={e => set('status', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none">
            {['Active', 'Expired', 'Draft'].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button type="submit" className="px-5 py-2.5 bg-accent text-white rounded-xl text-sm font-medium hover:bg-accent-hover">{contest ? 'Save Changes' : 'Create Contest'}</button>
        </div>
      </form>
    </Modal>
  )
}
