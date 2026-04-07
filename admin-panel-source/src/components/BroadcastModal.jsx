import { useState, useEffect } from 'react'
import Modal from './Modal'
import { validateRequired } from '../utils/validators'

export default function BroadcastModal({ isOpen, onClose, onSubmit, broadcast }) {
  const [form, setForm] = useState({ title: '', description: '', youtubeUrl: '', thumbnailUrl: '', type: 'live', startTime: '', endTime: '', status: 'Draft' })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (broadcast) setForm({ title: broadcast.title, description: broadcast.description || '', youtubeUrl: broadcast.youtubeUrl || '', thumbnailUrl: broadcast.thumbnailUrl || '', type: broadcast.type || 'live', startTime: broadcast.startTime || '', endTime: broadcast.endTime || '', status: broadcast.status || 'Draft' })
    else setForm({ title: '', description: '', youtubeUrl: '', thumbnailUrl: '', type: 'live', startTime: '', endTime: '', status: 'Draft' })
    setErrors({})
  }, [broadcast, isOpen])

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = {}
    if (validateRequired(form.title, 'Title')) errs.title = validateRequired(form.title, 'Title')
    if (Object.keys(errs).length) { setErrors(errs); return }
    onSubmit({ ...form })
  }

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={broadcast ? 'Edit Broadcast' : 'Create New Broadcast'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input type="text" value={form.title} onChange={e => set('title', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent" />
          {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent resize-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">YouTube URL</label>
          <input type="text" value={form.youtubeUrl} onChange={e => set('youtubeUrl', e.target.value)} placeholder="https://www.youtube.com/watch?v=..." className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail URL</label>
          <input type="text" value={form.thumbnailUrl} onChange={e => set('thumbnailUrl', e.target.value)} placeholder="Thumbnail image URL" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select value={form.type} onChange={e => set('type', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none">
              {['live', 'recorded', 'scheduled'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none">
              {['Live', 'Published', 'Scheduled', 'Draft'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
            <input type="datetime-local" value={form.startTime} onChange={e => set('startTime', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
            <input type="datetime-local" value={form.endTime} onChange={e => set('endTime', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none" />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button type="submit" className="px-5 py-2.5 bg-accent text-white rounded-xl text-sm font-medium hover:bg-accent-hover">{broadcast ? 'Save Changes' : 'Create Broadcast'}</button>
        </div>
      </form>
    </Modal>
  )
}
