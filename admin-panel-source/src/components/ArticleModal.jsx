import { useState, useEffect } from 'react'
import Modal from './Modal'
import { validateRequired } from '../utils/validators'

const tags = ['MUSIC', 'INDUSTRY', 'ARTIST SPOTLIGHT', 'TECH', 'LIFESTYLE', 'COMMUNITY']

export default function ArticleModal({ isOpen, onClose, onSubmit, article }) {
  const [form, setForm] = useState({ title: '', body: '', author: '', tag: 'MUSIC', featured: false, draft: false })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (article) setForm({ title: article.title, body: article.body || '', author: article.author, tag: article.tag, featured: article.featured, draft: article.draft })
    else setForm({ title: '', body: '', author: '', tag: 'MUSIC', featured: false, draft: false })
    setErrors({})
  }, [article, isOpen])

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = {}
    if (validateRequired(form.title, 'Title')) errs.title = validateRequired(form.title, 'Title')
    if (validateRequired(form.author, 'Author')) errs.author = validateRequired(form.author, 'Author')
    if (Object.keys(errs).length) { setErrors(errs); return }
    onSubmit(form)
  }

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={article ? 'Edit Article' : 'Create New Article'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input type="text" value={form.title} onChange={e => set('title', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent" placeholder="Article title" />
          {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Body</label>
          <textarea rows={4} value={form.body} onChange={e => set('body', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent resize-none" placeholder="Article content..." />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
            <input type="text" value={form.author} onChange={e => set('author', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent" placeholder="Author name" />
            {errors.author && <p className="text-xs text-red-500 mt-1">{errors.author}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tag</label>
            <select value={form.tag} onChange={e => set('tag', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none">
              {tags.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={form.featured} onChange={e => set('featured', e.target.checked)} className="rounded" /> Featured
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={form.draft} onChange={e => set('draft', e.target.checked)} className="rounded" /> Save as Draft
          </label>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button type="submit" className="px-5 py-2.5 bg-accent text-white rounded-xl text-sm font-medium hover:bg-accent-hover">{article ? 'Save Changes' : 'Create Article'}</button>
        </div>
      </form>
    </Modal>
  )
}
