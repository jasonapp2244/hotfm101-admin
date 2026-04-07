import { useState, useMemo, useEffect, useRef } from 'react'
import {
  Download, UserPlus, BarChart3, Wifi, Heart,
  MoreVertical, Shield, ArrowRight
} from 'lucide-react'
import Layout from '../components/Layout'
import { useData } from '../contexts/DataContext'
import { useToast } from '../contexts/ToastContext'
import useSearch from '../hooks/useSearch'
import usePagination from '../hooks/usePagination'
import UserModal from '../components/UserModal'
import ConfirmDialog from '../components/ConfirmDialog'
import Pagination from '../components/Pagination'
import { exportCSV } from '../utils/csv'
import { formatDate, formatRelativeTime, getInitials } from '../utils/formatters'

const statusColors = {
  Active: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  Disabled: 'bg-gray-100 text-gray-600 border border-gray-200',
  Pending: 'bg-amber-50 text-amber-700 border border-amber-200',
}

const tabs = ['All Users', 'Active Only', 'Disabled']
const roles = ['All', 'Listener', 'Editor', 'Staff', 'Admin']

export default function Users() {
  const { users, addUser, updateUser, deleteUser } = useData()
  const { addToast } = useToast()

  const [activeTab, setActiveTab] = useState('All Users')
  const [roleFilter, setRoleFilter] = useState('All')
  const [quickFilters, setQuickFilters] = useState({ verified: false, topListener: false, staff: false })
  const [editUser, setEditUser] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [actionMenuId, setActionMenuId] = useState(null)

  const menuRef = useRef(null)

  // Close action menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setActionMenuId(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Search
  const { query, setQuery, filteredItems: searchResults } = useSearch(users, ['name', 'email'])

  // Filter pipeline
  const filteredUsers = useMemo(() => {
    let result = searchResults

    // Tab filter
    if (activeTab === 'Active Only') result = result.filter(u => u.status === 'Active')
    else if (activeTab === 'Disabled') result = result.filter(u => u.status === 'Disabled')

    // Role filter
    if (roleFilter !== 'All') result = result.filter(u => u.role === roleFilter)

    // Quick filters
    if (quickFilters.verified) result = result.filter(u => u.verified)
    if (quickFilters.topListener) result = result.filter(u => u.topListener)
    if (quickFilters.staff) result = result.filter(u => u.staff)

    return result
  }, [searchResults, activeTab, roleFilter, quickFilters])

  // Pagination
  const { currentPage, setCurrentPage, paginatedItems, totalPages, totalItems, startIndex, endIndex } = usePagination(filteredUsers, 10)

  // Stats
  const totalCount = users.length
  const activeCount = users.filter(u => u.status === 'Active').length
  const loyaltyPct = totalCount > 0 ? Math.round((activeCount / totalCount) * 100) : 0

  // Handlers
  const handleInvite = () => {
    setEditUser(null)
    setShowModal(true)
  }

  const handleEdit = (user) => {
    setEditUser(user)
    setShowModal(true)
    setActionMenuId(null)
  }

  const handleDisable = (user) => {
    updateUser(user.id, { status: user.status === 'Disabled' ? 'Active' : 'Disabled' })
    addToast(`${user.name} has been ${user.status === 'Disabled' ? 'enabled' : 'disabled'}.`)
    setActionMenuId(null)
  }

  const handleDeleteClick = (id) => {
    setDeleteId(id)
    setShowConfirm(true)
    setActionMenuId(null)
  }

  const confirmDelete = () => {
    deleteUser(deleteId)
    addToast('User has been removed.', 'success')
    setShowConfirm(false)
    setDeleteId(null)
  }

  const handleModalSubmit = (form) => {
    if (editUser) {
      updateUser(editUser.id, form)
      addToast('User updated successfully.')
    } else {
      addUser(form)
      addToast('User invited successfully.')
    }
    setShowModal(false)
    setEditUser(null)
  }

  const handleExport = () => {
    exportCSV(filteredUsers, [
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'role', label: 'Role' },
      { key: 'joined', label: 'Date Joined' },
      { key: 'lastActive', label: 'Last Active' },
      { key: 'status', label: 'Status' },
    ], 'hot101-users.csv')
    addToast('CSV exported successfully.')
  }

  const toggleQuickFilter = (key) => {
    setQuickFilters(prev => ({ ...prev, [key]: !prev[key] }))
    setCurrentPage(1)
  }

  return (
    <Layout
      breadcrumb={['Home', 'Users']}
      searchPlaceholder="Search listeners by name or email..."
      searchValue={query}
      onSearchChange={setQuery}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h2 className="text-3xl font-extrabold text-primary mb-1">User Management</h2>
          <p className="text-gray-500">Manage and audit app listeners, station members, and digital contributors for the Hot FM network.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleExport} className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button onClick={handleInvite} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-light">
            <UserPlus className="w-4 h-4" /> Invite User
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-100 p-5 border-t-3 border-t-accent">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Listeners</span>
            <BarChart3 className="w-5 h-5 text-primary" />
          </div>
          <div className="text-3xl font-extrabold text-primary">{totalCount.toLocaleString()}</div>
          <p className="text-xs text-emerald-600 mt-1">+12% from last month</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 border-t-3 border-t-cyan-500">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Now</span>
            <Wifi className="w-5 h-5 text-primary" />
          </div>
          <div className="text-3xl font-extrabold text-primary">{activeCount.toLocaleString()}</div>
          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><span className="w-2 h-2 bg-emerald-500 rounded-full inline-block" /> Streaming Pulse: Stable</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 border-t-3 border-t-violet-500">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Station Loyalty</span>
            <Heart className="w-5 h-5 text-primary" />
          </div>
          <div className="text-3xl font-extrabold text-primary">{loyaltyPct}%</div>
          <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2"><div className="bg-accent h-1.5 rounded-full" style={{ width: `${loyaltyPct}%` }} /></div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl border border-gray-100 mb-8">
        {/* Tabs & Filter */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex gap-1">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setCurrentPage(1) }}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === tab ? 'bg-accent text-white' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <select
              value={roleFilter}
              onChange={e => { setRoleFilter(e.target.value); setCurrentPage(1) }}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none"
            >
              {roles.map(r => (
                <option key={r} value={r}>{r === 'All' ? 'Filter by Role' : r}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              {['NAME', 'EMAIL', 'DATE JOINED', 'LAST ACTIVE', 'STATUS', 'ACTIONS'].map(h => (
                <th key={h} className="text-left px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedItems.length === 0 && (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-400">No users found.</td></tr>
            )}
            {paginatedItems.map(u => (
              <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-300 to-blue-400 flex items-center justify-center text-white text-xs font-bold">{getInitials(u.name)}</div>
                    <span className="text-sm font-semibold text-primary">{u.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{u.email}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{formatDate(u.joined)}</td>
                <td className="px-6 py-4 text-sm font-medium text-gray-700">{formatRelativeTime(u.lastActive)}</td>
                <td className="px-6 py-4">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${statusColors[u.status] || ''}`}>{u.status}</span>
                </td>
                <td className="px-6 py-4 relative">
                  <button onClick={() => setActionMenuId(actionMenuId === u.id ? null : u.id)} className="p-1 text-gray-400 hover:text-gray-600">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  {actionMenuId === u.id && (
                    <div ref={menuRef} className="absolute right-6 top-12 z-20 bg-white border border-gray-200 rounded-xl shadow-lg py-1 w-40">
                      <button onClick={() => handleEdit(u)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Edit</button>
                      <button onClick={() => handleDisable(u)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        {u.status === 'Disabled' ? 'Enable' : 'Disable'}
                      </button>
                      <button onClick={() => handleDeleteClick(u.id)} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Delete</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          startIndex={startIndex}
          endIndex={endIndex}
          onPageChange={setCurrentPage}
          label="users"
        />
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="col-span-2 bg-amber-50/50 rounded-xl border border-amber-100 p-6 flex items-start gap-5">
          <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center shrink-0">
            <Shield className="w-7 h-7 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-primary mb-2">Security Audit Recommendation</h3>
            <p className="text-sm text-gray-600 mb-4">We've detected 12 inactive admin accounts that haven't been accessed in over 90 days. Professional standards recommend revoking access to maintain station security protocols.</p>
            <button className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest hover:text-accent">
              Review Inactive Admins <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Quick Filters</h4>
          <div className="space-y-3">
            {[
              { key: 'verified', label: 'Verified Contributors' },
              { key: 'topListener', label: 'Top 1% Listeners' },
              { key: 'staff', label: 'Station Staff' },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => toggleQuickFilter(f.key)}
                className="flex items-center justify-between w-full px-4 py-3 border border-gray-100 rounded-xl"
              >
                <span className="text-sm font-semibold text-primary">{f.label}</span>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${quickFilters[f.key] ? 'bg-accent border-accent text-white' : 'border-gray-300'}`}>
                  {quickFilters[f.key] && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="flex items-center justify-between pt-6 border-t border-gray-100 text-xs text-gray-400">
        <span>&copy; 2024 The Sonic Editorial &bull; Hot 101.5 Digital Management</span>
        <div className="flex gap-6">
          <a href="#" className="hover:text-gray-600">Privacy Policy</a>
          <a href="#" className="hover:text-gray-600">Terms of Service</a>
          <a href="#" className="hover:text-gray-600">API Documentation</a>
        </div>
      </footer>

      {/* Modals */}
      <UserModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditUser(null) }}
        onSubmit={handleModalSubmit}
        user={editUser}
      />
      <ConfirmDialog
        isOpen={showConfirm}
        onConfirm={confirmDelete}
        onCancel={() => { setShowConfirm(false); setDeleteId(null) }}
        title="Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />
    </Layout>
  )
}
