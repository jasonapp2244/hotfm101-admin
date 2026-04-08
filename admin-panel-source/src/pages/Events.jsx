import { useState, useMemo, useRef, useEffect } from 'react'
import {
  PlusCircle, Filter, MapPin, Calendar, Users, Trophy,
  MoreVertical, Pencil, Trash2, X
} from 'lucide-react'
import Layout from '../components/Layout'
import { useData } from '../contexts/DataContext'
import { useToast } from '../contexts/ToastContext'
import useSearch from '../hooks/useSearch'
import usePagination from '../hooks/usePagination'
import EventModal from '../components/EventModal'
import ConfirmDialog from '../components/ConfirmDialog'
import Pagination from '../components/Pagination'
import { exportCSV } from '../utils/csv'
import { formatDate, formatNumber } from '../utils/formatters'

const statusBadgeColors = {
  'Selling Fast': 'bg-amber-50 text-amber-700 border border-amber-200 italic',
  'Scheduled': 'bg-gray-100 text-gray-600 border border-gray-200',
  'Sold Out': 'bg-red-50 text-red-700 border border-red-200 italic',
  'Waitlist Only': 'bg-red-50 text-red-700 border border-red-200 italic',
}

export default function Events() {
  const { events, contests, addEvent, updateEvent, deleteEvent } = useData()
  const { addToast } = useToast()

  const [activeTab, setActiveTab] = useState('Upcoming Events')
  const [editEvent, setEditEvent] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [actionMenuId, setActionMenuId] = useState(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const [filters, setFilters] = useState({ sort: 'default', status: 'All', minRsvp: '' })
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
    filters.status !== 'All',
    filters.minRsvp !== '',
  ].filter(Boolean).length

  const clearFilters = () => setFilters({ sort: 'default', status: 'All', minRsvp: '' })

  const today = new Date().toISOString().split('T')[0]

  const tabFiltered = useMemo(() => {
    if (activeTab === 'Upcoming Events') return events.filter(e => e.date >= today)
    return events.filter(e => e.date < today)
  }, [events, activeTab, today])

  const { query, setQuery, filteredItems: searched } = useSearch(tabFiltered, ['name', 'location'])

  const filteredItems = useMemo(() => {
    let result = [...searched]

    if (filters.status !== 'All') result = result.filter(e => e.status === filters.status)
    if (filters.minRsvp !== '') result = result.filter(e => (e.rsvp || 0) >= Number(filters.minRsvp))

    switch (filters.sort) {
      case 'name_asc':    result.sort((a, b) => a.name.localeCompare(b.name)); break
      case 'name_desc':   result.sort((a, b) => b.name.localeCompare(a.name)); break
      case 'date_asc':    result.sort((a, b) => new Date(a.date) - new Date(b.date)); break
      case 'date_desc':   result.sort((a, b) => new Date(b.date) - new Date(a.date)); break
      case 'rsvp_desc':   result.sort((a, b) => (b.rsvp || 0) - (a.rsvp || 0)); break
      case 'capacity_desc': result.sort((a, b) => (b.capacity || 0) - (a.capacity || 0)); break
      default: break
    }

    return result
  }, [searched, filters])

  const { currentPage, setCurrentPage, paginatedItems, totalPages, totalItems, startIndex, endIndex } = usePagination(filteredItems, 10)

  useEffect(() => { setCurrentPage(1) }, [filters, activeTab, query])

  // Stats
  const upcomingEvents = events.filter(e => e.date >= today)
  const liveNowEvent = upcomingEvents[0]
  const totalRsvp = events.reduce((sum, e) => sum + (e.rsvp || 0), 0)
  const activeContestsCount = contests.filter(c => c.status === 'Active').length

  const upcomingCount = events.filter(e => e.date >= today).length
  const pastCount = events.filter(e => e.date < today).length

  const handleCreate = () => { setEditEvent(null); setShowModal(true) }
  const handleEdit = (event) => { setEditEvent(event); setShowModal(true); setActionMenuId(null) }
  const handleDelete = (id) => { setDeleteId(id); setShowConfirm(true); setActionMenuId(null) }

  const handleSubmit = (form) => {
    if (editEvent) {
      updateEvent(editEvent.id, form)
      addToast('Event updated successfully')
    } else {
      addEvent(form)
      addToast('Event created successfully')
    }
    setShowModal(false)
  }

  const confirmDelete = () => {
    deleteEvent(deleteId)
    addToast('Event deleted', 'error')
    setShowConfirm(false)
    setDeleteId(null)
  }

  return (
    <Layout
      breadcrumb={['Home', 'Events']}
      searchPlaceholder="Search events by name or location..."
      searchValue={query}
      onSearchChange={setQuery}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h2 className="text-3xl font-extrabold text-primary mb-1">Events & Live Shows</h2>
          <p className="text-gray-500">Manage upcoming events, RSVPs, and live broadcast schedules.</p>
        </div>
        <div className="flex gap-3">
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
                    <option value="name_asc">Name A → Z</option>
                    <option value="name_desc">Name Z → A</option>
                    <option value="date_asc">Date: Earliest First</option>
                    <option value="date_desc">Date: Latest First</option>
                    <option value="rsvp_desc">Most RSVPs</option>
                    <option value="capacity_desc">Largest Capacity</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Status</label>
                  <select
                    value={filters.status}
                    onChange={e => setFilters(p => ({ ...p, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                  >
                    {['All', 'Scheduled', 'Selling Fast', 'Sold Out', 'Waitlist Only'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Minimum RSVPs</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 100"
                    value={filters.minRsvp}
                    onChange={e => setFilters(p => ({ ...p, minRsvp: e.target.value }))}
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
            <PlusCircle className="w-4 h-4" /> Create New Event
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-100 p-5 border-t-3 border-t-accent">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Live Now</span>
            <Calendar className="w-5 h-5 text-accent" />
          </div>
          <div className="text-xl font-extrabold text-primary truncate">{liveNowEvent?.name || 'Midnight Rooftop Sessions'}</div>
          <p className="text-xs text-gray-500 mt-1">{liveNowEvent?.location || 'Sky Lounge'}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 border-t-3 border-t-blue-500">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total RSVP</span>
            <Users className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-3xl font-extrabold text-primary">{formatNumber(totalRsvp)}</div>
          <p className="text-xs text-gray-500 mt-1">All events combined</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 border-t-3 border-t-emerald-500">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Contests</span>
            <Trophy className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-3xl font-extrabold text-primary">{activeContestsCount}</div>
          <p className="text-xs text-emerald-600 mt-1">Currently running</p>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl border border-gray-100 mb-8">
        {/* Tabs */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex gap-1">
            {['Upcoming Events', 'Past Events'].map(tab => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setCurrentPage(1) }}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === tab ? 'bg-accent text-white' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                {tab} ({tab === 'Upcoming Events' ? upcomingCount : pastCount})
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              {['EVENT NAME', 'DATE & TIME', 'LOCATION', 'RSVP COUNT', 'CAPACITY', 'STATUS', 'ACTIONS'].map(h => (
                <th key={h} className="text-left px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedItems.map(ev => {
              const pct = ev.capacity ? Math.round((ev.rsvp / ev.capacity) * 100) : 0
              return (
                <tr key={ev.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-violet-200 to-indigo-300 rounded-lg shrink-0 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-indigo-700" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-primary">{ev.name}</div>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">{ev.type}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-700">{formatDate(ev.date)}</div>
                    <div className="text-xs text-gray-400">{ev.time}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-sm text-gray-700">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      {ev.location}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-primary border border-gray-200 rounded-md px-2.5 py-1">
                      {formatNumber(ev.rsvp)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-100 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${pct >= 90 ? 'bg-red-500' : pct >= 60 ? 'bg-amber-500' : 'bg-accent'}`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{ev.rsvp}/{ev.capacity}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${statusBadgeColors[ev.status] || statusBadgeColors.Scheduled}`}>
                      {ev.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 relative">
                    <button
                      onClick={() => setActionMenuId(actionMenuId === ev.id ? null : ev.id)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {actionMenuId === ev.id && (
                      <div className="absolute right-6 top-12 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-1 w-36">
                        <button onClick={() => handleEdit(ev)} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                          <Pencil className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button onClick={() => handleDelete(ev.id)} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
            {paginatedItems.length === 0 && (
              <tr><td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-400">No events found.</td></tr>
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
          label="events"
        />
      </div>

      {/* Modals */}
      <EventModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmit}
        event={editEvent}
      />
      <ConfirmDialog
        isOpen={showConfirm}
        onConfirm={confirmDelete}
        onCancel={() => setShowConfirm(false)}
        title="Delete Event"
        message="Are you sure you want to delete this event? This action cannot be undone."
      />
    </Layout>
  )
}
