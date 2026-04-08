import { useState, useMemo, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Megaphone, Plus, Download, Filter, MapPin, MoreVertical, Pencil, Trash2,
  Image, BarChart3, X
} from 'lucide-react'
import Layout from '../components/Layout'
import { useData } from '../contexts/DataContext'
import { useToast } from '../contexts/ToastContext'
import useSearch from '../hooks/useSearch'
import usePagination from '../hooks/usePagination'
import AdModal from '../components/AdModal'
import ConfirmDialog from '../components/ConfirmDialog'
import Pagination from '../components/Pagination'
import { exportCSV } from '../utils/csv'
import { formatDate, formatNumber } from '../utils/formatters'

const statusColors = {
  Active: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  Expired: 'bg-gray-100 text-gray-600 border border-gray-200',
  Draft: 'bg-amber-50 text-amber-700 border border-amber-200',
}

export default function Ads() {
  const { ads, addAd, updateAd, deleteAd, adAnalytics } = useData()
  const { addToast } = useToast()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('Active')
  const [editAd, setEditAd] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [actionMenuId, setActionMenuId] = useState(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const [filters, setFilters] = useState({ sort: 'default', minRadius: '', maxRadius: '' })
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
    filters.minRadius !== '',
    filters.maxRadius !== '',
  ].filter(Boolean).length

  const clearFilters = () => setFilters({ sort: 'default', minRadius: '', maxRadius: '' })

  const tabFiltered = useMemo(() =>
    ads.filter(a => a.status === activeTab), [ads, activeTab])

  const { query, setQuery, filteredItems: searched } = useSearch(tabFiltered, ['title', 'businessName', 'address'])

  const filteredItems = useMemo(() => {
    let result = [...searched]

    if (filters.minRadius !== '') result = result.filter(a => (a.radiusKm || 0) >= Number(filters.minRadius))
    if (filters.maxRadius !== '') result = result.filter(a => (a.radiusKm || 0) <= Number(filters.maxRadius))

    switch (filters.sort) {
      case 'title_asc':     result.sort((a, b) => a.title.localeCompare(b.title)); break
      case 'title_desc':    result.sort((a, b) => b.title.localeCompare(a.title)); break
      case 'radius_desc':   result.sort((a, b) => (b.radiusKm || 0) - (a.radiusKm || 0)); break
      case 'radius_asc':    result.sort((a, b) => (a.radiusKm || 0) - (b.radiusKm || 0)); break
      case 'start_asc':     result.sort((a, b) => new Date(a.startDate) - new Date(b.startDate)); break
      case 'start_desc':    result.sort((a, b) => new Date(b.startDate) - new Date(a.startDate)); break
      default: break
    }

    return result
  }, [searched, filters])

  const { currentPage, setCurrentPage, paginatedItems, totalPages, totalItems, startIndex, endIndex } = usePagination(filteredItems, 10)

  useEffect(() => { setCurrentPage(1) }, [filters, activeTab, query])

  // Stats
  const activeCount = ads.filter(a => a.status === 'Active').length
  const totalImpressions = ads.reduce((sum, a) => {
    const m = (adAnalytics || {})[a.id] || { impressions: 0 }
    return sum + m.impressions
  }, 0)
  const totalClicks = ads.reduce((sum, a) => {
    const m = (adAnalytics || {})[a.id] || { clicks: 0 }
    return sum + m.clicks
  }, 0)
  const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions * 100).toFixed(1) : '0.0'
  const totalGeofenceEntries = ads.reduce((sum, a) => {
    const m = (adAnalytics || {})[a.id] || { geofenceEntries: 0 }
    return sum + m.geofenceEntries
  }, 0)

  const tabCounts = {
    Active: ads.filter(a => a.status === 'Active').length,
    Expired: ads.filter(a => a.status === 'Expired').length,
    Draft: ads.filter(a => a.status === 'Draft').length,
  }

  const handleCreate = () => { setEditAd(null); setShowModal(true) }
  const handleEdit = (ad) => { setEditAd(ad); setShowModal(true); setActionMenuId(null) }
  const handleDelete = (id) => { setDeleteId(id); setShowConfirm(true); setActionMenuId(null) }

  const handleSubmit = (form) => {
    if (editAd) {
      updateAd(editAd.id, form)
      addToast('Ad updated successfully')
    } else {
      addAd(form)
      addToast('Ad created successfully')
    }
    setShowModal(false)
  }

  const confirmDelete = () => {
    deleteAd(deleteId)
    addToast('Ad deleted', 'error')
    setShowConfirm(false)
    setDeleteId(null)
  }

  const handleExport = () => {
    exportCSV(filteredItems, [
      { label: 'Title', key: 'title' },
      { label: 'Business', key: 'businessName' },
      { label: 'Address', key: 'address' },
      { label: 'Radius (km)', key: 'radiusKm' },
      { label: 'Start', key: 'startDate' },
      { label: 'End', key: 'endDate' },
      { label: 'Status', key: 'status' },
    ], 'ads.csv')
    addToast('CSV exported')
  }

  return (
    <Layout
      breadcrumb={['Station Hub', 'Ads Management']}
      searchPlaceholder="Search ads by title, business, or address..."
      searchValue={query}
      onSearchChange={setQuery}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h2 className="text-3xl font-extrabold text-primary mb-1">Ad Campaigns</h2>
          <p className="text-gray-500">Manage location-based advertising campaigns and sponsored content.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate('/ads/analytics')} className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
            <BarChart3 className="w-4 h-4" /> View Analytics
          </button>
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
                    <option value="radius_desc">Radius: Largest First</option>
                    <option value="radius_asc">Radius: Smallest First</option>
                    <option value="start_asc">Start Date: Earliest</option>
                    <option value="start_desc">Start Date: Latest</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Geofence Radius (km)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      placeholder="Min"
                      value={filters.minRadius}
                      onChange={e => setFilters(p => ({ ...p, minRadius: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                    />
                    <span className="text-gray-400 text-xs shrink-0">to</span>
                    <input
                      type="number"
                      min="0"
                      placeholder="Max"
                      value={filters.maxRadius}
                      onChange={e => setFilters(p => ({ ...p, maxRadius: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                    />
                  </div>
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
            <Plus className="w-4 h-4" /> Create New Ad
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-100 p-5 border-t-3 border-t-emerald-500">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Ads</span>
            <Megaphone className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-3xl font-extrabold text-primary">{activeCount}</div>
          <p className="text-xs text-emerald-600 mt-1">Currently running</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 border-t-3 border-t-blue-500">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Impressions</span>
            <BarChart3 className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-3xl font-extrabold text-primary">{formatNumber(totalImpressions)}</div>
          <p className="text-xs text-gray-500 mt-1">All-time ad views</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 border-t-3 border-t-amber-500">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Avg CTR</span>
            <Megaphone className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-3xl font-extrabold text-primary">{avgCtr}%</div>
          <p className="text-xs text-gray-500 mt-1">Weighted average</p>
        </div>
        <div className="bg-gradient-to-r from-primary to-accent rounded-xl p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Geofence Entries</span>
            <MapPin className="w-5 h-5 text-white/70" />
          </div>
          <div className="text-3xl font-extrabold">{formatNumber(totalGeofenceEntries)}</div>
          <p className="text-xs text-white/60 mt-1">Total location triggers</p>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl border border-gray-100 mb-8">
        {/* Tabs */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex gap-1">
            {['Active', 'Expired', 'Draft'].map(tab => (
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
              {['AD INFO', 'LOCATION', 'RADIUS', 'DATES', 'IMPRESSIONS', 'CLICKS', 'CTR', 'GEOFENCE', 'STATUS', 'ACTIONS'].map(h => (
                <th key={h} className="text-left px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedItems.map(a => (
              <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {a.images && a.images.length > 0 ? (
                      <img src={a.images[0]} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-200 to-purple-300 rounded-lg shrink-0 flex items-center justify-center">
                        <Megaphone className="w-5 h-5 text-blue-700" />
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-semibold text-primary">{a.title}</div>
                      <div className="text-xs text-gray-400">{a.businessName}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5 text-sm text-gray-700">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    {a.address}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-xs font-bold text-accent bg-accent/10 px-2.5 py-1 rounded-md">{a.radiusKm || 0}km</span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-700">{formatDate(a.startDate)}</div>
                  <div className="text-xs text-gray-400">{formatDate(a.endDate)}</div>
                </td>
                {(() => {
                  const metrics = (adAnalytics || {})[a.id] || { impressions: 0, clicks: 0, geofenceEntries: 0, notificationOpens: 0, directionRequests: 0 }
                  const ctr = metrics.impressions > 0 ? (metrics.clicks / metrics.impressions * 100).toFixed(1) : '0.0'
                  const ctrNum = parseFloat(ctr)
                  const ctrColor = ctrNum > 10 ? 'text-emerald-600' : ctrNum > 5 ? 'text-amber-600' : 'text-red-500'
                  return (
                    <>
                      <td className="px-6 py-4 text-sm text-gray-700">{formatNumber(metrics.impressions)}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{formatNumber(metrics.clicks)}</td>
                      <td className="px-6 py-4"><span className={`text-sm font-semibold ${ctrColor}`}>{ctr}%</span></td>
                      <td className="px-6 py-4 text-sm text-gray-700">{formatNumber(metrics.geofenceEntries)}</td>
                    </>
                  )
                })()}
                <td className="px-6 py-4">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${statusColors[a.status] || statusColors.Draft}`}>
                    {a.status}
                  </span>
                </td>
                <td className="px-6 py-4 relative">
                  <button
                    onClick={() => setActionMenuId(actionMenuId === a.id ? null : a.id)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  {actionMenuId === a.id && (
                    <div className="absolute right-6 top-12 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-1 w-36">
                      <button onClick={() => handleEdit(a)} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button onClick={() => handleDelete(a.id)} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {paginatedItems.length === 0 && (
              <tr><td colSpan={10} className="px-6 py-12 text-center text-sm text-gray-400">No ads found.</td></tr>
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
          label="ads"
        />
      </div>

      {/* Modals */}
      <AdModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmit}
        ad={editAd}
      />
      <ConfirmDialog
        isOpen={showConfirm}
        onConfirm={confirmDelete}
        onCancel={() => setShowConfirm(false)}
        title="Delete Ad"
        message="Are you sure you want to delete this ad? This action cannot be undone."
      />
    </Layout>
  )
}
