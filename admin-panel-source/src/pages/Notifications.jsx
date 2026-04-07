import { useState, useMemo } from 'react'
import { Send, Download, SlidersHorizontal, Pause, Volume2 } from 'lucide-react'
import Layout from '../components/Layout'
import { useData } from '../contexts/DataContext'
import { useToast } from '../contexts/ToastContext'
import { useAuth } from '../contexts/AuthContext'
import usePagination from '../hooks/usePagination'
import Pagination from '../components/Pagination'
import { exportCSV } from '../utils/csv'
import { formatDate, formatTime, formatNumber } from '../utils/formatters'

const targetColors = {
  'Live Stream': 'bg-emerald-100 text-emerald-700',
  'News Article': 'bg-blue-100 text-blue-700',
  'Contest Page': 'bg-purple-100 text-purple-700',
}

const periods = ['All Time', 'Today', 'This Week', 'This Month']

function isInPeriod(dateStr, period) {
  if (period === 'All Time') return true
  const d = new Date(dateStr)
  const now = new Date()
  if (period === 'Today') return d.toDateString() === now.toDateString()
  if (period === 'This Week') {
    const weekAgo = new Date(now)
    weekAgo.setDate(now.getDate() - 7)
    return d >= weekAgo
  }
  if (period === 'This Month') {
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }
  return true
}

export default function Notifications() {
  const { notifications, addNotification } = useData()
  const { addToast } = useToast()
  const { user } = useAuth()

  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('Join the conversation and win tickets to the summer festival!')
  const [target, setTarget] = useState('Live Stream')
  const [schedule, setSchedule] = useState('NOW')
  const [scheduledTime, setScheduledTime] = useState('')
  const [filterPeriod, setFilterPeriod] = useState('All Time')
  const [showFilterMenu, setShowFilterMenu] = useState(false)

  const filtered = useMemo(
    () => notifications.filter(n => isInPeriod(n.date, filterPeriod)),
    [notifications, filterPeriod]
  )

  const { currentPage, setCurrentPage, paginatedItems, totalPages, totalItems, startIndex, endIndex } = usePagination(filtered, 5)

  const handleSend = () => {
    if (!title.trim() || !message.trim()) {
      addToast('Title and message are required.', 'error')
      return
    }
    addNotification({ title, message, target, sentBy: user?.name || 'Admin' })
    addToast('Notification sent successfully!', 'success')
    setTitle('')
    setMessage('')
    setSchedule('NOW')
    setScheduledTime('')
  }

  const handleExport = () => {
    exportCSV(filtered, [
      { key: 'title', label: 'Title' },
      { key: 'message', label: 'Message' },
      { key: 'target', label: 'Target' },
      { key: 'date', label: 'Date' },
      { key: 'sentBy', label: 'Sent By' },
      { key: 'reach', label: 'Reach' },
    ], 'notifications.csv')
  }

  const getInitials = (name) => {
    if (!name) return '??'
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <Layout breadcrumb={['Station Hub', 'Push Console']}>
      {/* Compose + Preview */}
      <div className="grid grid-cols-5 gap-8 mb-12">
        {/* Compose Form */}
        <div className="col-span-3">
          <h2 className="text-3xl font-extrabold text-primary mb-1">Compose Notification</h2>
          <p className="text-gray-500 mb-8">Reach all listeners instantly across iOS and Android devices.</p>

          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Notification Title</label>
              <input
                type="text"
                placeholder="e.g., Live Now: Morning Show with DJ Spark"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent placeholder:text-gray-400"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Message Body</label>
              <textarea
                rows={3}
                value={message}
                onChange={e => setMessage(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent resize-none placeholder:text-gray-400"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Target Deep Link</label>
                <select
                  value={target}
                  onChange={e => setTarget(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none"
                >
                  <option>Live Stream</option>
                  <option>News Article</option>
                  <option>Contest Page</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Scheduling</label>
                <div className="flex border border-gray-200 rounded-xl overflow-hidden">
                  {['NOW', 'LATER'].map(s => (
                    <button
                      key={s}
                      onClick={() => setSchedule(s)}
                      className={`flex-1 py-3 text-sm font-semibold ${schedule === s ? 'bg-primary text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                    >{s}</button>
                  ))}
                </div>
              </div>
            </div>
            {schedule === 'LATER' && (
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Scheduled Date & Time</label>
                <input
                  type="datetime-local"
                  value={scheduledTime}
                  onChange={e => setScheduledTime(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                />
              </div>
            )}
            <button
              onClick={handleSend}
              className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-accent to-indigo-500 text-white rounded-xl text-sm font-semibold hover:from-accent-hover hover:to-indigo-600 cursor-pointer"
            >
              <Send className="w-4 h-4" /> Send to All Listeners
            </button>
          </div>
        </div>

        {/* iOS Preview */}
        <div className="col-span-2 flex flex-col items-center">
          <div className="w-64 bg-gradient-to-b from-indigo-900 to-primary rounded-[2.5rem] p-3 shadow-2xl">
            <div className="bg-gradient-to-b from-indigo-800 to-primary rounded-[2rem] overflow-hidden">
              <div className="px-6 pt-12 pb-4 text-center">
                <div className="text-4xl font-bold text-white">10:15</div>
                <div className="text-sm text-white/60 mt-1">Monday, October 23</div>
              </div>
              <div className="mx-3 mb-6 bg-white/15 backdrop-blur-sm rounded-2xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-5 h-5 bg-accent rounded-md flex items-center justify-center text-white text-[8px] font-bold">H</div>
                  <span className="text-[10px] text-white/80 font-medium">Hot FM 101.5</span>
                  <span className="text-[10px] text-white/40 ml-auto">now</span>
                </div>
                <div className="text-xs font-semibold text-white">{title || 'Live Now: Morning Show...'}</div>
                <div className="text-[11px] text-white/70 mt-0.5 leading-tight">{message}</div>
              </div>
              <div className="h-16" />
            </div>
          </div>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-4">Live iOS Preview</div>
        </div>
      </div>

      {/* Notification History */}
      <div className="bg-white rounded-xl border border-gray-100">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h3 className="text-xl font-extrabold text-primary">Notification History</h3>
            <p className="text-sm text-gray-500 mt-0.5">Detailed log of all pushed communications and their engagement.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
            <div className="relative">
              <button
                onClick={() => setShowFilterMenu(!showFilterMenu)}
                className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" /> Filter: {filterPeriod}
              </button>
              {showFilterMenu && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 w-40">
                  {periods.map(p => (
                    <button
                      key={p}
                      onClick={() => { setFilterPeriod(p); setShowFilterMenu(false); setCurrentPage(1) }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${filterPeriod === p ? 'text-accent font-semibold' : 'text-gray-600'}`}
                    >{p}</button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              {['TITLE & MESSAGE', 'TARGET', 'SENT AT', 'SENT BY', 'REACH'].map(h => (
                <th key={h} className="text-left px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedItems.map(n => (
              <tr key={n.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="px-6 py-4">
                  <div className="text-sm font-semibold text-primary">{n.title}</div>
                  <div className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{n.message}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${targetColors[n.target] || 'bg-gray-100 text-gray-600'}`}>{n.target}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-700">{formatDate(n.date)}</div>
                  <div className="text-xs text-gray-400">{formatTime(n.date)}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-300 to-blue-400 flex items-center justify-center text-white text-[10px] font-bold">
                      {getInitials(n.sentBy)}
                    </div>
                    <span className="text-sm text-gray-700">{n.sentBy}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-lg font-extrabold text-accent">{formatNumber(n.reach)}</span>
                </td>
              </tr>
            ))}
            {paginatedItems.length === 0 && (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">No notifications found.</td></tr>
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
          label="notifications"
        />
      </div>

      {/* Now Playing Bar */}
      <div className="bg-gradient-to-r from-red-600 to-primary rounded-2xl px-6 py-3 flex items-center justify-between text-white mt-8">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
            <div className="flex gap-0.5">{[...Array(5)].map((_, i) => <div key={i} className="w-0.5 bg-white/60 rounded-full" style={{ height: `${8 + Math.random() * 12}px` }} />)}</div>
          </div>
          <div>
            <div className="text-[9px] font-bold uppercase tracking-widest text-white/50">Currently On-Air</div>
            <div className="text-sm font-semibold">The Midnight Remix &mdash; DJ Nova ft. Luna</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-24 bg-white/10 rounded-full h-1"><div className="bg-accent h-1 rounded-full" style={{ width: '45%' }} /></div>
          <Volume2 className="w-4 h-4 text-white/40" />
          <div className="text-right">
            <div className="text-[9px] font-bold uppercase tracking-widest text-white/50">Listeners</div>
            <div className="text-sm font-bold text-emerald-400">14,293</div>
          </div>
          <button className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20"><Pause className="w-5 h-5" /></button>
        </div>
      </div>
    </Layout>
  )
}
