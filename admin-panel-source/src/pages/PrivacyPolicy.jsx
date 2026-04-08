import { useState, useEffect } from 'react'
import { doc, getDoc, setDoc, updateDoc, collection, addDoc, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import Layout from '../components/Layout'
import { ScrollText, PlusCircle, Pencil, Eye, Clock, User, ChevronDown, ChevronUp, Save, X } from 'lucide-react'

const TABS = ['View', 'Edit / Update', 'Version History']

export default function PrivacyPolicy() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const [tab, setTab] = useState('View')

  const [policy, setPolicy]         = useState(null)   // current live doc
  const [versions, setVersions]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)
  const [editContent, setEditContent] = useState('')
  const [editTitle, setEditTitle]   = useState('')
  const [expandedId, setExpandedId] = useState(null)

  const isAdmin = ['super admin', 'admin'].includes(user?.roleNorm)

  // ── load live policy ──────────────────────────────────────────────
  useEffect(() => {
    const ref = doc(db, 'settings', 'privacy_policy')
    const unsub = onSnapshot(ref, snap => {
      if (snap.exists()) {
        setPolicy({ id: snap.id, ...snap.data() })
      } else {
        setPolicy(null)
      }
      setLoading(false)
    })
    return () => unsub()
  }, [])

  // ── load version history ──────────────────────────────────────────
  useEffect(() => {
    const ref = collection(db, 'settings', 'privacy_policy', 'versions')
    const unsub = onSnapshot(ref, snap => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      docs.sort((a, b) => {
        const at = a.savedAt?.toMillis?.() || 0
        const bt = b.savedAt?.toMillis?.() || 0
        return bt - at
      })
      setVersions(docs)
    })
    return () => unsub()
  }, [])

  // ── pre-fill editor when switching to Edit tab ────────────────────
  useEffect(() => {
    if (tab === 'Edit / Update') {
      setEditTitle(policy?.title || '')
      setEditContent(policy?.content || '')
    }
  }, [tab, policy])

  // ── save (add or update) ──────────────────────────────────────────
  const handleSave = async () => {
    if (!editTitle.trim()) { addToast('Title is required.', 'error'); return }
    if (!editContent.trim()) { addToast('Content is required.', 'error'); return }

    setSaving(true)
    try {
      const ref = doc(db, 'settings', 'privacy_policy')

      // Archive current version before overwriting
      if (policy?.content) {
        await addDoc(collection(db, 'settings', 'privacy_policy', 'versions'), {
          title:    policy.title || 'Untitled',
          content:  policy.content,
          savedAt:  policy.updatedAt || policy.createdAt || serverTimestamp(),
          savedBy:  policy.updatedBy || policy.createdBy || '—',
        })
      }

      const payload = {
        title:     editTitle.trim(),
        content:   editContent.trim(),
        updatedAt: serverTimestamp(),
        updatedBy: user?.name || user?.email || '—',
      }

      if (!policy) {
        await setDoc(ref, { ...payload, createdAt: serverTimestamp(), createdBy: user?.name || user?.email || '—' })
        addToast('Privacy policy created!', 'success')
      } else {
        await updateDoc(ref, payload)
        addToast('Privacy policy updated!', 'success')
      }

      setTab('View')
    } catch (err) {
      console.error(err)
      const msg = err?.code === 'permission-denied'
        ? 'Permission denied. Check Firestore rules.'
        : err?.message || 'Failed to save. Please try again.'
      addToast(msg, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Layout breadcrumb={['Settings', 'Privacy Policy']}>
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
              <ScrollText className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-primary">Privacy Policy</h2>
              <p className="text-xs text-gray-400">Manage your platform's privacy policy document</p>
            </div>
          </div>
          {isAdmin && tab === 'View' && (
            <button
              onClick={() => setTab('Edit / Update')}
              className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-xl text-sm font-medium hover:bg-accent-hover transition-colors"
            >
              {policy ? <Pencil className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
              {policy ? 'Edit Policy' : 'Add Policy'}
            </button>
          )}
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 mb-6 bg-gray-50 rounded-xl p-1 w-fit">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                tab === t
                  ? 'bg-white text-primary shadow-sm border border-gray-100'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* ── VIEW TAB ─────────────────────────────────────────────── */}
        {tab === 'View' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            {loading ? (
              <div className="flex items-center justify-center py-24 text-gray-400 text-sm">Loading…</div>
            ) : !policy ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
                <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center">
                  <ScrollText className="w-7 h-7 text-gray-300" />
                </div>
                <p className="text-sm font-semibold text-gray-500">No privacy policy published yet.</p>
                {isAdmin && (
                  <button
                    onClick={() => setTab('Edit / Update')}
                    className="mt-1 flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-xl text-sm font-medium hover:bg-accent-hover"
                  >
                    <PlusCircle className="w-4 h-4" /> Add Privacy Policy
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Meta bar */}
                <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-center gap-4">
                  <h3 className="text-base font-bold text-primary flex-1">{policy.title}</h3>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
                    {policy.updatedAt && (
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        Updated {formatTimestamp(policy.updatedAt)}
                      </span>
                    )}
                    {policy.updatedBy && (
                      <span className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" />
                        {policy.updatedBy}
                      </span>
                    )}
                    {policy.createdAt && (
                      <span className="flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5" />
                        Created {formatTimestamp(policy.createdAt)}
                      </span>
                    )}
                  </div>
                </div>
                {/* Content */}
                <div className="px-6 py-6 prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed text-sm">
                  {policy.content}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── EDIT / UPDATE TAB ────────────────────────────────────── */}
        {tab === 'Edit / Update' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
            {!isAdmin ? (
              <p className="text-sm text-gray-500 text-center py-12">You do not have permission to edit the privacy policy.</p>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Policy Title</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    placeholder="e.g. Privacy Policy — Effective April 2026"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Policy Content
                    <span className="ml-2 text-[11px] text-gray-400 font-normal">Plain text — use blank lines to separate sections</span>
                  </label>
                  <textarea
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    rows={20}
                    placeholder="Write your full privacy policy here…"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent leading-relaxed"
                  />
                </div>

                {policy && (
                  <p className="text-[11px] text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                    Saving will overwrite the current policy. The previous version will be archived in Version History.
                  </p>
                )}

                <div className="flex justify-end gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setTab('View')}
                    className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <X className="w-4 h-4" /> Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-accent text-white rounded-xl text-sm font-medium hover:bg-accent-hover disabled:opacity-60"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving…' : policy ? 'Update Policy' : 'Publish Policy'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── VERSION HISTORY TAB ──────────────────────────────────── */}
        {tab === 'Version History' && (
          <div className="space-y-3">
            {versions.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-20 gap-3 text-center">
                <Clock className="w-8 h-8 text-gray-200" />
                <p className="text-sm font-semibold text-gray-400">No previous versions yet.</p>
                <p className="text-xs text-gray-400">Versions are saved each time the policy is updated.</p>
              </div>
            ) : (
              versions.map((v, i) => (
                <div key={v.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
                    onClick={() => setExpandedId(expandedId === v.id ? null : v.id)}
                  >
                    <div className="flex items-center gap-3 text-left">
                      <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 text-[10px] font-bold flex items-center justify-center shrink-0">
                        {versions.length - i}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{v.title || 'Untitled'}</p>
                        <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
                          <Clock className="w-3 h-3" /> {formatTimestamp(v.savedAt)}
                          {v.savedBy && <><User className="w-3 h-3 ml-1" />{v.savedBy}</>}
                        </p>
                      </div>
                    </div>
                    {expandedId === v.id
                      ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                      : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                    }
                  </button>
                  {expandedId === v.id && (
                    <div className="px-6 pb-5 pt-1 border-t border-gray-100 text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                      {v.content}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

      </div>
    </Layout>
  )
}

function formatTimestamp(ts) {
  if (!ts) return '—'
  const d = typeof ts.toDate === 'function' ? ts.toDate() : new Date(ts)
  return d.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
}
