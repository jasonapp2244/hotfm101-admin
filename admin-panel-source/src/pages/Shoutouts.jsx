import { useState } from 'react'
import { Zap, CheckCircle2, XCircle, Play, Search } from 'lucide-react'
import Layout from '../components/Layout'
import { useData } from '../contexts/DataContext'
import { useToast } from '../contexts/ToastContext'
import useSearch from '../hooks/useSearch'
import { formatRelativeTime } from '../utils/formatters'

const statusBadge = {
  pending: 'bg-amber-400/80 text-amber-900',
  approved: 'bg-emerald-400/80 text-emerald-900',
  rejected: 'bg-red-400/80 text-white',
}

export default function Shoutouts() {
  const { shoutouts, approveShoutout, rejectShoutout } = useData()
  const { addToast } = useToast()
  const [activeTab, setActiveTab] = useState('pending')
  const [reviewingId, setReviewingId] = useState(null)
  const [playingId, setPlayingId] = useState(null)

  const tabShoutouts = shoutouts.filter(s => s.status === activeTab)
  const { query, setQuery, filteredItems } = useSearch(tabShoutouts, ['name'])

  const pendingCount = shoutouts.filter(s => s.status === 'pending').length
  const approvedCount = shoutouts.filter(s => s.status === 'approved').length
  const rejectedCount = shoutouts.filter(s => s.status === 'rejected').length

  // Featured card: first high-priority pending item, or first item
  const featuredIndex = filteredItems.findIndex(s => s.priority === 'high')
  const featured = filteredItems[featuredIndex !== -1 ? featuredIndex : 0]
  const restCards = filteredItems.filter(s => s.id !== featured?.id)

  const handleApprove = (id) => {
    approveShoutout(id)
    addToast('Shoutout approved successfully!', 'success')
    setReviewingId(null)
  }

  const handleReject = (id) => {
    rejectShoutout(id)
    addToast('Shoutout rejected.', 'success')
    setReviewingId(null)
  }

  const tabs = [
    { key: 'pending', label: `Pending (${pendingCount})` },
    { key: 'approved', label: `Approved` },
    { key: 'rejected', label: `Rejected` },
  ]

  return (
    <Layout
      breadcrumb={['Station Hub', 'Video Shoutouts']}
      searchPlaceholder="Search submissions..."
      searchValue={query}
      onSearchChange={setQuery}
    >
      <div className="flex items-start justify-between mb-8">
        <h2 className="text-3xl font-extrabold text-primary">Queue Management</h2>
        <div className="flex gap-1">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                activeTab === tab.key
                  ? 'bg-white border border-gray-200 text-primary shadow-sm'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="text-center py-20 text-gray-400">No shoutouts found.</div>
      ) : (
        <>
          {/* Cards Grid */}
          <div className="grid grid-cols-3 gap-5 mb-5">
            {/* Featured Large Card */}
            {featured && (
              <div className="col-span-1 relative rounded-2xl overflow-hidden h-80 group cursor-pointer" style={{ gridRow: 'span 2' }}>
                <div className={`absolute inset-0 bg-gradient-to-br ${featured.gradient}`} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                {featured.priority === 'high' && (
                  <div className="absolute top-4 left-4">
                    <span className="bg-red-500 text-white text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md">High Priority</span>
                  </div>
                )}
                {/* Play button */}
                {playingId === featured.id && (
                  <div className="absolute top-4 right-4 flex items-center gap-1.5">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="w-1 bg-white rounded-full animate-pulse" style={{ height: `${10 + Math.random() * 14}px`, animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setPlayingId(playingId === featured.id ? null : featured.id)}
                        className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30"
                      >
                        <Play className="w-5 h-5 text-white" />
                      </button>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-bold">{featured.name}</span>
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${statusBadge[featured.status]}`}>
                            {featured.status}
                          </span>
                        </div>
                        <div className="text-white/70 text-xs">{formatRelativeTime(featured.time)} &bull; {featured.location}</div>
                      </div>
                    </div>
                  </div>
                  {activeTab === 'pending' && (
                    <div className="mt-3">
                      {reviewingId === featured.id ? (
                        <div className="flex gap-2">
                          <button onClick={() => handleApprove(featured.id)} className="flex-1 py-2 bg-emerald-500/90 backdrop-blur-sm text-white text-sm font-medium rounded-xl hover:bg-emerald-500 flex items-center justify-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4" /> Approve
                          </button>
                          <button onClick={() => handleReject(featured.id)} className="flex-1 py-2 bg-red-500/90 backdrop-blur-sm text-white text-sm font-medium rounded-xl hover:bg-red-500 flex items-center justify-center gap-1.5">
                            <XCircle className="w-4 h-4" /> Reject
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setReviewingId(featured.id)} className="w-full py-2 bg-white/20 backdrop-blur-sm text-white text-sm font-medium rounded-xl hover:bg-white/30 text-center">
                          Review Shoutout
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* First two small cards beside featured */}
            {restCards.slice(0, 2).map(card => (
              <ShoutoutCard
                key={card.id}
                card={card}
                activeTab={activeTab}
                reviewingId={reviewingId}
                setReviewingId={setReviewingId}
                onApprove={handleApprove}
                onReject={handleReject}
                className="h-36"
              />
            ))}
          </div>

          {/* Bottom row */}
          <div className="grid grid-cols-4 gap-5 mb-8">
            {restCards.slice(2).map(card => (
              <ShoutoutCard
                key={card.id}
                card={card}
                activeTab={activeTab}
                reviewingId={reviewingId}
                setReviewingId={setReviewingId}
                onApprove={handleApprove}
                onReject={handleReject}
                className="h-44"
              />
            ))}

          </div>
        </>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-primary rounded-xl p-5 text-white flex items-center gap-4">
          <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center"><Zap className="w-6 h-6 text-amber-400" /></div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-white/60">Avg Review Time</div>
            <div className="text-3xl font-extrabold">42s</div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 border-t-3 border-t-emerald-500 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center"><CheckCircle2 className="w-6 h-6 text-emerald-600" /></div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Approved Today</div>
            <div className="text-3xl font-extrabold text-primary">{approvedCount}</div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 border-t-3 border-t-red-500 flex items-center gap-4">
          <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center"><XCircle className="w-6 h-6 text-red-600" /></div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Rejected Today</div>
            <div className="text-3xl font-extrabold text-primary">{rejectedCount}</div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

function ShoutoutCard({ card, activeTab, reviewingId, setReviewingId, onApprove, onReject, className = '' }) {
  return (
    <div className={`relative rounded-2xl overflow-hidden group cursor-pointer ${className}`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient}`} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className="flex items-center gap-2">
          <span className="text-white font-bold text-sm">{card.name}</span>
          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${statusBadge[card.status]}`}>
            {card.status}
          </span>
        </div>
        <div className="text-white/60 text-xs mt-0.5">{formatRelativeTime(card.time)} {card.location && `\u2022 ${card.location}`}</div>
        {activeTab === 'pending' && (
          <div className="mt-2">
            {reviewingId === card.id ? (
              <div className="flex gap-2">
                <button onClick={() => onApprove(card.id)} className="flex-1 py-1.5 bg-emerald-500/90 backdrop-blur-sm text-white text-xs font-medium rounded-xl hover:bg-emerald-500 flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                </button>
                <button onClick={() => onReject(card.id)} className="flex-1 py-1.5 bg-red-500/90 backdrop-blur-sm text-white text-xs font-medium rounded-xl hover:bg-red-500 flex items-center justify-center gap-1">
                  <XCircle className="w-3.5 h-3.5" /> Reject
                </button>
              </div>
            ) : (
              <button onClick={() => setReviewingId(card.id)} className="w-full py-1.5 bg-white/20 backdrop-blur-sm text-white text-sm font-medium rounded-xl hover:bg-white/30 text-center">
                Review
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
