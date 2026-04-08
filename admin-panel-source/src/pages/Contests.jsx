import { useState, useMemo, useRef, useEffect } from 'react'
import {
  PlusCircle, Download, Filter, Trophy, Users, DollarSign, TrendingUp,
  MoreVertical, Pencil, Trash2, X
} from 'lucide-react'
import Layout from '../components/Layout'
import { useData } from '../contexts/DataContext'
import { useToast } from '../contexts/ToastContext'
import useSearch from '../hooks/useSearch'
import usePagination from '../hooks/usePagination'
import ContestModal from '../components/ContestModal'
import EntriesModal from '../components/EntriesModal'
import ConfirmDialog from '../components/ConfirmDialog'
import Pagination from '../components/Pagination'
import { exportCSV } from '../utils/csv'
import { formatDate, formatNumber } from '../utils/formatters'

const statusColors = {
  Active: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  Expired: 'bg-gray-100 text-gray-600 border border-gray-200',
  Draft: 'bg-amber-50 text-amber-700 border border-amber-200',
}

export default function Contests() {
  const { contests, addContest, updateContest, deleteContest } = useData()
  const { addToast } = useToast()

  const [activeTab, setActiveTab] = useState('Active')
  const [editContest, setEditContest] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [entriesContest, setEntriesContest] = useState(null)
  const [showEntries, setShowEntries] = useState(false)
  const [actionMenuId, setActionMenuId] = useState(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const [filters, setFilters] = useState({ sort: 'default', minValue: '', maxValue: '', minEntries: '' })
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
    filters.minValue !== '',
    filters.maxValue !== '',
    filters.minEntries !== '',
  ].filter(Boolean).length

  const clearFilters = () => setFilters({ sort: 'default', minValue: '', maxValue: '', minEntries: '' })

  const tabFiltered = useMemo(() =>
    contests.filter(c => c.status === activeTab), [contests, activeTab])

  const { query, setQuery, filteredItems: searched } = useSearch(tabFiltered, ['name'])

  const filteredItems = useMemo(() => {
    let result = [...searched]

    // Prize value range
    if (filters.minValue !== '') result = result.filter(c => (c.value || 0) >= Number(filters.minValue))
    if (filters.maxValue !== '') result = result.filter(c => (c.value || 0) <= Number(filters.maxValue))

    // Min entries
    if (filters.minEntries !== '') result = result.filter(c => (c.entries?.length || 0) >= Number(filters.minEntries))

    // Sort
    switch (filters.sort) {
      case 'name_asc':    result.sort((a, b) => a.name.localeCompare(b.name)); break
      case 'name_desc':   result.sort((a, b) => b.name.localeCompare(a.name)); break
      case 'value_desc':  result.sort((a, b) => (b.value || 0) - (a.value || 0)); break
      case 'value_asc':   result.sort((a, b) => (a.value || 0) - (b.value || 0)); break
      case 'entries_desc':result.sort((a, b) => (b.entries?.length || 0) - (a.entries?.length || 0)); break
      case 'start_asc':   result.sort((a, b) => new Date(a.start) - new Date(b.start)); break
      default: break
    }

    return result
  }, [searched, filters])

  const { currentPage, setCurrentPage, paginatedItems, totalPages, totalItems, startIndex, endIndex } = usePagination(filteredItems, 10)

  // Reset to page 1 whenever filters or tab changes
  useEffect(() => { setCurrentPage(1) }, [filters, activeTab, query])

  // Stats
  const activeCount = contests.filter(c => c.status === 'Active').length
  const totalEntries = contests.reduce((sum, c) => sum + (c.entries?.length || 0), 0)
  const prizePool = contests.filter(c => c.status === 'Active').reduce((sum, c) => sum + (c.value || 0), 0)

  const tabCounts = {
    Active: contests.filter(c => c.status === 'Active').length,
    Expired: contests.filter(c => c.status === 'Expired').length,
    Draft: contests.filter(c => c.status === 'Draft').length,
  }

  const handleCreate = () => { setEditContest(null); setShowModal(true) }
  const handleEdit = (contest) => { setEditContest(contest); setShowModal(true); setActionMenuId(null) }
  const handleDelete = (id) => { setDeleteId(id); setShowConfirm(true); setActionMenuId(null) }

  const handleSubmit = (form) => {
    if (editContest) {
      updateContest(editContest.id, form)
      addToast('Contest updated successfully')
    } else {
      addContest(form)
      addToast('Contest created successfully')
    }
    setShowModal(false)
  }

  const confirmDelete = () => {
    deleteContest(deleteId)
    addToast('Contest deleted', 'error')
    setShowConfirm(false)
    setDeleteId(null)
  }

  const handleExport = () => {
    exportCSV(filteredItems, [
      { label: 'Name', key: 'name' },
      { label: 'Prize', key: 'prize' },
      { label: 'Value', key: 'value' },
      { label: 'Start', key: 'start' },
      { label: 'End', key: 'end' },
      { label: 'Status', key: 'status' },
    ], 'contests.csv')
    addToast('CSV exported')
  }

  const handleViewEntries = (contest) => { setEntriesContest(contest); setShowEntries(true) }

  return (
    <Layout
      breadcrumb={['Home', 'Contests']}
      searchPlaceholder="Search contests by name..."
      searchValue={query}
      onSearchChange={setQuery}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h2 className="text-3xl font-extrabold text-primary mb-1">Contests & Giveaways</h2>
          <p className="text-gray-500">Manage active promotions, prizes, and listener contest entries.</p>
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
                {/* Header */}
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Filter & Sort</p>
                  {activeFilterCount > 0 && (
                    <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 font-medium">
                      <X className="w-3 h-3" /> Clear all
                    </button>
                  )}
                </div>

                {/* Sort */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Sort by</label>
                  <select
                    value={filters.sort}
                    onChange={e => setFilters(p => ({ ...p, sort: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                  >
                    <option value="default">Default</option>
                    <option value="name_asc">Name A → Z</option>
                    <option value="name_desc">Name Z → A</option>
                    <option value="value_desc">Prize Value: High → Low</option>
                    <option value="value_asc">Prize Value: Low → High</option>
                    <option value="entries_desc">Most Entries</option>
                    <option value="start_asc">Start Date: Earliest</option>
                  </select>
                </div>

                {/* Prize value range */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Prize Value ($)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      placeholder="Min"
                      value={filters.minValue}
                      onChange={e => setFilters(p => ({ ...p, minValue: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                    />
                    <span className="text-gray-400 text-xs">to</span>
                    <input
                      type="number"
                      min="0"
                      placeholder="Max"
                      value={filters.maxValue}
                      onChange={e => setFilters(p => ({ ...p, maxValue: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                    />
                  </div>
                </div>

                {/* Min entries */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Minimum Entries</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 5"
                    value={filters.minEntries}
                    onChange={e => setFilters(p => ({ ...p, minEntries: e.target.value }))}
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
            <PlusCircle className="w-4 h-4" /> Create New Contest
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-100 p-5 border-t-3 border-t-emerald-500">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Contests</span>
            <Trophy className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-3xl font-extrabold text-primary">{activeCount}</div>
          <p className="text-xs text-emerald-600 mt-1">Currently running</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 border-t-3 border-t-blue-500">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Entries</span>
            <Users className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-3xl font-extrabold text-primary">{formatNumber(totalEntries)}</div>
          <p className="text-xs text-gray-500 mt-1">Across all contests</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 border-t-3 border-t-amber-500">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Prize Pool</span>
            <DollarSign className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-3xl font-extrabold text-primary">${prizePool.toLocaleString()}</div>
          <p className="text-xs text-gray-500 mt-1">Active contest value</p>
        </div>
        <div className="bg-gradient-to-r from-primary to-accent rounded-xl p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Avg CTR</span>
            <TrendingUp className="w-5 h-5 text-white/70" />
          </div>
          <div className="text-3xl font-extrabold">8.4%</div>
          <p className="text-xs text-white/60 mt-1">Click-through rate</p>
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
              {['CONTEST NAME', 'PRIZE SUMMARY', 'DATES', 'ENTRY COUNT', 'STATUS', 'ACTIONS'].map(h => (
                <th key={h} className="text-left px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedItems.map(c => (
              <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-200 to-orange-300 rounded-lg shrink-0 flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-amber-700" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-primary">{c.name}</div>
                      <div className="text-xs text-gray-400">{c.id}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-700">{c.prize}</div>
                  <div className="text-xs text-gray-400">${c.value?.toLocaleString()}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-700">{formatDate(c.start)}</div>
                  <div className="text-xs text-gray-400">{formatDate(c.end)}</div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-bold text-primary">{c.entries?.length || 0}</span>
                  <button
                    onClick={() => handleViewEntries(c)}
                    className="block text-xs text-accent hover:underline mt-0.5"
                  >
                    View Entries
                  </button>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${statusColors[c.status] || statusColors.Draft}`}>
                    {c.status}
                  </span>
                </td>
                <td className="px-6 py-4 relative">
                  <button
                    onClick={() => setActionMenuId(actionMenuId === c.id ? null : c.id)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  {actionMenuId === c.id && (
                    <div className="absolute right-6 top-12 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-1 w-36">
                      <button onClick={() => handleEdit(c)} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button onClick={() => handleDelete(c.id)} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {paginatedItems.length === 0 && (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-400">No contests found.</td></tr>
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
          label="contests"
        />
      </div>

      {/* Modals */}
      <ContestModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmit}
        contest={editContest}
      />
      <EntriesModal
        isOpen={showEntries}
        onClose={() => setShowEntries(false)}
        contest={entriesContest}
      />
      <ConfirmDialog
        isOpen={showConfirm}
        onConfirm={confirmDelete}
        onCancel={() => setShowConfirm(false)}
        title="Delete Contest"
        message="Are you sure you want to delete this contest? This action cannot be undone."
      />
    </Layout>
  )
}
