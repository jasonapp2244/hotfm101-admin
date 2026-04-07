import { useState, useEffect } from 'react'
import Modal from './Modal'
import { validateRequired } from '../utils/validators'

export default function EventModal({ isOpen, onClose, onSubmit, event }) {
  const [form, setForm] = useState({ name: '', type: 'CONCERT', date: '', time: '', location: '', capacity: '', status: 'Scheduled' })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (event) setForm({ name: event.name, type: event.type, date: event.date, time: event.time, location: event.location, capacity: String(event.capacity), status: event.status })
    else setForm({ name: '', type: 'CONCERT', date: '', time: '', location: '', capacity: '', status: 'Scheduled' })
    setErrors({})
  }, [event, isOpen])

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = {}
    if (validateRequired(form.name, 'Name')) errs.name = validateRequired(form.name, 'Name')
    if (validateRequired(form.location, 'Location')) errs.location = validateRequired(form.location, 'Location')
    if (Object.keys(errs).length) { setErrors(errs); return }
    onSubmit({ ...form, capacity: Number(form.capacity) || 100 })
  }

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={event ? 'Edit Event' : 'Create New Event'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Event Name</label>
          <input type="text" value={form.name} onChange={e => set('name', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent" />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select value={form.type} onChange={e => set('type', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none">
              {['CONCERT', 'MUSIC FESTIVAL', 'LIVE REMOTE', 'GALA NIGHT', 'LIVE PERFORMANCE', 'WORKSHOP', 'COMMUNITY EVENT'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none">
              {['Scheduled', 'Selling Fast', 'Sold Out', 'Waitlist Only'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input type="date" value={form.date} onChange={e => set('date', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
            <input type="text" value={form.time} onChange={e => set('time', e.target.value)} placeholder="07:00 PM EST" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input type="text" value={form.location} onChange={e => set('location', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent" />
            {errors.location && <p className="text-xs text-red-500 mt-1">{errors.location}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
            <input type="number" value={form.capacity} onChange={e => set('capacity', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none" />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button type="submit" className="px-5 py-2.5 bg-accent text-white rounded-xl text-sm font-medium hover:bg-accent-hover">{event ? 'Save Changes' : 'Create Event'}</button>
        </div>
      </form>
    </Modal>
  )
}
