import { useState, useMemo, useRef, useEffect } from 'react'
import {
  Video, Plus, Download, Filter, Play, Eye, MoreVertical, Pencil, Trash2,
  Radio, Clock, ExternalLink, X
} from 'lucide-react'
import Layout from '../components/Layout'
import { useData } from '../contexts/DataContext'
import { useToast } from '../contexts/ToastContext'
import useSearch from '../hooks/useSearch'
import usePagination from '../hooks/usePagination'
import BroadcastModal from '../components/BroadcastModal'
import ConfirmDialog from '../components/ConfirmDialog'
import Pagination from '../components/Pagination'
import { exportCSV } from '../utils/csv'
import { formatDate, formatTime, formatNumber } from '../utils/formatters'

const statusColors = {
  Live: 'bg-red-50 text-red-700 border border-red-200',
  Published: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  Scheduled: 'bg-amber-50 text-amber-700 border border-amber-200',
  Draft: 'bg-gray-100 text-gray-600 border border-gray-200',
}

const typeBadge = {
  live: 'bg-red-100 text-red-700',
  recorded: 'bg-blue-100 text-blue-700',
  scheduled: 'bg-amber-100 text-amber-700',
}

function getYoutubeEmbedUrl(url) {
  if (!url) return null
  const match = url.match(/(?:v=|\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return match ? `https://www.youtube.com/embed/${match[1]}` : null
}

export default function Broadcasting() {
  const { broadcasts, addBroadcast, updateBroadcast, deleteBroadcast } = useData()
  const { addToast } = useToast()

  const [activeTab, setActiveTab] = useState('Live')
  const [editBroadcast, setEditBroadcast] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [actionMenuId, setActionMenuId] = useState(null)
  const [previewId, setPreviewId] = useState(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const [filters, setFilters] = useState({ sort: 'default', type: 'All', minViewers: '' })
  const filterRef = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const activeFilterCount = [
    filters.sort !== 'default',
    filters.type !== 'All',
    filters.minViewers !== '',
  ].filter(Boolean).length

  const clearFilters = () => setFilters({ sort: 'default', type: 'All', minViewers: '' })

  const tabFiltered = useMemo(() =>
    broadcasts.filter(b => b.status === activeTab), [broadcasts, activeTab])

  const { query, setQuery, filteredItems: searched } = useSearch(tabFiltered, ['title', 'description'])

  const filteredItems = useMemo(() => {
    let result = [...searched]

    if (filters.type !== 'All') result = result.filter(b => b.type === filters.type)
    if (filters.minViewers !== '') result = result.filter(b => (b.viewerCount || 0) >= Number(filters.minViewers))

    switch (filters.sort) {
      case 'title_asc':    result.sort((a, b) => a.title.localeCompare(b.title)); break
      case 'title_desc':   result.sort((a, b) => b.title.localeCompare(a.title)); break
      case 'viewers_desc': result.sort((a, b) => (b.viewerCount || 0) - (a.viewerCount || 0)); break
      case 'viewers_asc':  result.sort((a, b) => (a.viewerCount || 0) - (b.viewerCount || 0)); break
      case 'date_asc':     result.sort((a, b) => new Date(a.startTime) - new Date(b.startTime)); break
      case 'date_desc':    result.sort((a, b) => new Date(b.startTime) - new Date(a.startTime)); break
      default: break
    }

    return result
  }, [searched, filters])

  const { currentPage, setCurrentPage, paginatedItems, totalPages, totalItems, startIndex, endIndex } = usePagination(filteredItems, 10)

  useEffect(() => { setCurrentPage(1) }, [filters, activeTab, query])

  // Stats
  const liveCount = broadcasts.filter(b => b.status === 'Live').length
  const totalViews = broadcasts.reduce((sum, b) => sum + (b.viewerCount || 0), 0)
  const publishedCount = broadcasts.filter(b => b.status === 'Published').length
  const scheduledCount = broadcasts.filter(b => b.status === 'Scheduled').length

  const tabCounts = {
    Live: liveCount,
    Published: publishedCount,
    Scheduled: scheduledCount,
    Draft: broadcasts.filter(b => b.status === 'Draft').length,
  }

  const handleCreate = () => { setEditBroadcast(null); setShowModal(true) }
  const handleEdit = (broadcast) => { setEditBroadcast(broadcast); setShowModal(true); setActionMenuId(null) }
  const handleDelete = (id) => { setDeleteId(id); setShowConfirm(true); setActionMenuId(null) }

  const handleSubmit = (form) => {
    if (editBroadcast) {
      updateBroadcast(editBroadcast.id, form)
      addToast('Broadcast updated successfully')
    } else {
      addBroadcast(form)
      addToast('Broadcast created successfully')
    }
    setShowModal(false)
  }

  const confirmDelete = () => {
    deleteBroadcast(deleteId)
    addToast('Broadcast deleted', 'error')
    setShowConfirm(false)
    setDeleteId(null)
  }

  const handleExport = () => {
    exportCSV(filteredItems, [
      { label: 'Title', key: 'title' },
      { label: 'Description', key: 'description' },
      { label: 'YouTube URL', key: 'youtubeUrl' },
      { label: 'Type', key: 'type' },
      { label: 'Start Time', key: 'startTime' },
      { label: 'End Time', key: 'endTime' },
      { label: 'Viewers', key: 'viewerCount' },
      { label: 'Status', key: 'status' },
    ], 'broadcasts.csv')
    addToast('CSV exported')
  }

  return (
    <Layout
      breadcrumb={['Station Hub', 'Broadcasting']}
      searchPlaceholder="Search broadcasts..."
      searchValue={query}
      onSearchChange={setQuery}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h2 className="text-3xl font-extrabold text-primary mb-1">Broadcasting Hub</h2>
          <p className="text-gray-500">Manage video content, live streams, and scheduled broadcasts.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleExport} className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setFilterOpen(prev => !prev)}
              className={`flex items-center gap-2 px-5 py-2.5 border rounded-xl text-sm font-medium transition-colors ${
                filterOpen || activeFilterCount > 0
                  ? 'border-accent text-accent bg-accent/5'
                  : 'border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4" /> Filter
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {filterOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 z-30 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Filter & Sort</p>
                  {activeFilterCount > 0 && (
                    <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 font-medium">
                      <X className="w-3 h-3" /> Clear all
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Sort by</label>
                  <select
                    value={filters.sort}
                    onChange={e => setFilters(p => ({ ...p, sort: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                  >
                    <option value="default">Default</option>
                    <option value="title_asc">Title A → Z</option>
                    <option value="title_desc">Title Z → A</option>
                    <option value="viewers_desc">Viewers: High → Low</option>
                    <option value="viewers_asc">Viewers: Low → High</option>
                    <option value="date_asc">Start Time: Earliest</option>
                    <option value="date_desc">Start Time: Latest</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Broadcast Type</label>
                  <select
                    value={filters.type}
                    onChange={e => setFilters(p => ({ ...p, type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                  >
                    {['All', 'live', 'recorded', 'scheduled'].map(t => (
                      <option key={t} value={t}>{t === 'All' ? 'All Types' : t.charAt(0).toUpperCase() + t.slice(1)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Minimum Viewers</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 500"
                    value={filters.minViewers}
                    onChange={e => setFilters(p => ({ ...p, minViewers: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                  />
                </div>

                <button
                  onClick={() => setFilterOpen(false)}
                  className="w-full py-2 bg-accent text-white rounded-lg text-sm font-semibold hover:bg-accent-hover transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            )}
          </div>
          <button onClick={handleCreate} className="flex items-center gap-2 px-5 py-2.5 bg-accent text-white rounded-xl text-sm font-medium hover:bg-accent-hover">
            <Plus className="w-4 h-4" /> Create New Broadcast
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-100 p-5 border-t-3 border-t-red-500">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Live Now</span>
            <Radio className="w-5 h-5 text-red-500" />
          </div>
          <div className="flex items-center gap-2">
            <div className="text-3xl font-extrabold text-primary">{liveCount}</div>
            {liveCount > 0 && <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>}
          </div>
          <p className="text-xs text-red-600 mt-1">Currently streaming</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 border-t-3 border-t-blue-500">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Views</span>
            <Eye className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-3xl font-extrabold text-primary">{formatNumber(totalViews)}</div>
          <p className="text-xs text-gray-500 mt-1">Across all broadcasts</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 border-t-3 border-t-emerald-500">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Published</span>
            <Play className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-3xl font-extrabold text-primary">{publishedCount}</div>
          <p className="text-xs text-gray-500 mt-1">Available to viewers</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 border-t-3 border-t-amber-500">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Scheduled</span>
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-3xl font-extrabold text-primary">{scheduledCount}</div>
          <p className="text-xs text-gray-500 mt-1">Upcoming broadcasts</p>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl border border-gray-100 mb-8">
        {/* Tabs */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex gap-1">
            {['Live', 'Published', 'Scheduled', 'Draft'].map(tab => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setCurrentPage(1) }}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === tab ? 'bg-accent text-white' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                {tab} ({tabCounts[tab]})
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              {['BROADCAST', 'YOUTUBE', 'VIEWERS', 'SCHEDULE', 'STATUS', 'ACTIONS'].map(h => (
                <th key={h} className="text-left px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedItems.map(b => (
              <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-[60px] h-[40px] rounded-lg shrink-0 overflow-hidden bg-gray-100">
                      {b.thumbnailUrl ? (
                        <img src={b.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-200 to-indigo-300 flex items-center justify-center">
                          <Video className="w-4 h-4 text-indigo-700" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-primary">{b.title}</div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${typeBadge[b.type] || typeBadge.recorded}`}>
                        {b.type}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {b.youtubeUrl ? (
                    <div className="flex items-center gap-2">
                      <a href={b.youtubeUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent-hover">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => setPreviewId(previewId === b.id ? null : b.id)}
                        className="text-xs text-gray-500 truncate max-w-[120px] hover:text-accent"
                        title={b.youtubeUrl}
                      >
                        {b.youtubeUrl.replace(/^https?:\/\/(www\.)?/, '').slice(0, 30)}...
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">No URL</span>
                  )}
                  {previewId === b.id && getYoutubeEmbedUrl(b.youtubeUrl) && (
                    <div className="mt-2">
                      <iframe
                        width="200"
                        height="112"
                        src={getYoutubeEmbedUrl(b.youtubeUrl)}
                        title="YouTube preview"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="rounded-lg"
                      />
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-bold text-primary">{formatNumber(b.viewerCount || 0)}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-700">{b.startTime ? formatDate(b.startTime) : '—'}</div>
                  <div className="text-xs text-gray-400">{b.startTime ? formatTime(b.startTime) : ''}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${statusColors[b.status] || statusColors.Draft}`}>
                    {b.status === 'Live' && (
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                    )}
                    {b.status}
                  </span>
                </td>
                <td className="px-6 py-4 relative">
                  <button
                    onClick={() => setActionMenuId(actionMenuId === b.id ? null : b.id)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  {actionMenuId === b.id && (
                    <div className="absolute right-6 top-12 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-1 w-36">
                      <button onClick={() => handleEdit(b)} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button onClick={() => handleDelete(b.id)} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {paginatedItems.length === 0 && (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-400">No broadcasts found.</td></tr>
            )}
          </tbody>
        </table>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          startIndex={startIndex}
          endIndex={endIndex}
          onPageChange={setCurrentPage}
          label="broadcasts"
        />
      </div>

      {/* Modals */}
      <BroadcastModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmit}
        broadcast={editBroadcast}
      />
      <ConfirmDialog
        isOpen={showConfirm}
        onConfirm={confirmDelete}
        onCancel={() => setShowConfirm(false)}
        title="Delete Broadcast"
        message="Are you sure you want to delete this broadcast? This action cannot be undone."
      />
    </Layout>
  )
}
