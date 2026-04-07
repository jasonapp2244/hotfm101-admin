import { useState, useEffect } from 'react'
import Modal from './Modal'
import { validateRequired } from '../utils/validators'

export default function AdModal({ isOpen, onClose, onSubmit, ad }) {
  const [form, setForm] = useState({ title: '', description: '', images: '', businessName: '', address: '', latitude: '', longitude: '', radiusKm: '2', startDate: '', endDate: '', status: 'Active' })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (ad) setForm({ title: ad.title, description: ad.description || '', images: (ad.images || []).join(', '), businessName: ad.businessName, address: ad.address, latitude: String(ad.latitude || ''), longitude: String(ad.longitude || ''), radiusKm: String(ad.radiusKm || 2), startDate: ad.startDate || '', endDate: ad.endDate || '', status: ad.status })
    else setForm({ title: '', description: '', images: '', businessName: '', address: '', latitude: '', longitude: '', radiusKm: '2', startDate: '', endDate: '', status: 'Active' })
    setErrors({})
  }, [ad, isOpen])

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = {}
    if (validateRequired(form.title, 'Title')) errs.title = validateRequired(form.title, 'Title')
    if (validateRequired(form.businessName, 'Business Name')) errs.businessName = validateRequired(form.businessName, 'Business Name')
    if (validateRequired(form.address, 'Address')) errs.address = validateRequired(form.address, 'Address')
    if (Object.keys(errs).length) { setErrors(errs); return }
    onSubmit({
      ...form,
      images: form.images ? form.images.split(',').map(s => s.trim()).filter(Boolean) : [],
      latitude: Number(form.latitude) || 0,
      longitude: Number(form.longitude) || 0,
      radiusKm: Number(form.radiusKm) || 2,
    })
  }

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={ad ? 'Edit Ad' : 'Create New Ad'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input type="text" value={form.title} onChange={e => set('title', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent" />
          {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Images (comma-separated URLs)</label>
          <input type="text" value={form.images} onChange={e => set('images', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent" placeholder="https://example.com/img1.jpg, https://example.com/img2.jpg" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
          <input type="text" value={form.businessName} onChange={e => set('businessName', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent" />
          {errors.businessName && <p className="text-xs text-red-500 mt-1">{errors.businessName}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <input type="text" value={form.address} onChange={e => set('address', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent" />
          {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
            <input type="number" step="any" value={form.latitude} onChange={e => set('latitude', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
            <input type="number" step="any" value={form.longitude} onChange={e => set('longitude', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Radius (km)</label>
            <input type="number" step="any" value={form.radiusKm} onChange={e => set('radiusKm', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input type="date" value={form.endDate} onChange={e => set('endDate', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none" />
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
          <button type="submit" className="px-5 py-2.5 bg-accent text-white rounded-xl text-sm font-medium hover:bg-accent-hover">{ad ? 'Save Changes' : 'Create Ad'}</button>
        </div>
      </form>
    </Modal>
  )
}
