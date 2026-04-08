import { useState, useMemo } from 'react'
import {
  PlusCircle, List, Grid3X3, Pencil, Trash2, Star, Eye,
  FileText, TrendingUp, Flame
} from 'lucide-react'
import Layout from '../components/Layout'
import { useData } from '../contexts/DataContext'
import { useToast } from '../contexts/ToastContext'
import useSearch from '../hooks/useSearch'
import usePagination from '../hooks/usePagination'
import ArticleModal from '../components/ArticleModal'
import ConfirmDialog from '../components/ConfirmDialog'
import Pagination from '../components/Pagination'
import { formatDate, formatTime, formatNumber, getInitials } from '../utils/formatters'

const tabs = ['All Articles', 'Featured', 'Published', 'Drafts']

const tagColors = {
  MUSIC: 'bg-emerald-100 text-emerald-700',
  INDUSTRY: 'bg-blue-100 text-blue-700',
  'ARTIST SPOTLIGHT': 'bg-purple-100 text-purple-700',
  TECH: 'bg-gray-100 text-gray-600',
  LIFESTYLE: 'bg-pink-100 text-pink-700',
  COMMUNITY: 'bg-amber-100 text-amber-700',
}

export default function Content() {
  const { articles, addArticle, updateArticle, deleteArticle } = useData()
  const { addToast } = useToast()

  const [activeTab, setActiveTab] = useState('All Articles')
  const [viewMode, setViewMode] = useState('list')
  const [editArticle, setEditArticle] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [showConfirm, setShowConfirm] = useState(false)

  // Search
  const { query, setQuery, filteredItems: searched } = useSearch(articles, ['title', 'author', 'tag'])

  // Tab filter
  const tabFiltered = useMemo(() => {
    switch (activeTab) {
      case 'Featured': return searched.filter(a => a.featured)
      case 'Published': return searched.filter(a => !a.draft && a.date)
      case 'Drafts': return searched.filter(a => a.draft)
      default: return searched
    }
  }, [searched, activeTab])

  // Pagination
  const {
    currentPage, setCurrentPage, paginatedItems,
    totalPages, totalItems, startIndex, endIndex
  } = usePagination(tabFiltered, 8)

  // Stats
  const draftsCount = articles.filter(a => a.draft).length
  const weeklyViews = articles.reduce((sum, a) => sum + (a.views || 0), 0)

  // Handlers
  const handleCreate = () => {
    setEditArticle(null)
    setShowModal(true)
  }
  const handleEdit = (article) => {
    setEditArticle(article)
    setShowModal(true)
  }
  const handleSubmit = (form) => {
    if (editArticle) {
      updateArticle(editArticle.id, form)
      addToast('Article updated successfully', 'success')
    } else {
      addArticle(form)
      addToast('Article created successfully', 'success')
    }
    setShowModal(false)
    setEditArticle(null)
  }
  const handleDeleteClick = (id) => {
    setDeleteId(id)
    setShowConfirm(true)
  }
  const handleDeleteConfirm = () => {
    deleteArticle(deleteId)
    addToast('Article deleted', 'success')
    setShowConfirm(false)
    setDeleteId(null)
  }
  const toggleFeatured = (article) => {
    updateArticle(article.id, { featured: !article.featured })
  }
  const toggleLive = (article) => {
    updateArticle(article.id, { live: !article.live })
  }

  return (
    <Layout
      breadcrumb={['Home', 'Content']}
      searchPlaceholder="Search articles by title, author, or tag..."
      searchValue={query}
      onSearchChange={setQuery}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h2 className="text-3xl font-extrabold text-primary mb-1">Content Studio</h2>
          <p className="text-gray-500">Manage articles, stories, and editorial content for the Hot 101.5 digital platform.</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-5 py-2.5 bg-accent text-white rounded-xl text-sm font-medium hover:bg-accent-hover"
        >
          <PlusCircle className="w-4 h-4" /> Create New Article
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {/* Total Stories */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Stories</span>
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div className="text-3xl font-extrabold text-primary">{articles.length}</div>
          <p className="text-xs text-gray-500 mt-1">{articles.filter(a => !a.draft).length} published</p>
        </div>

        {/* Drafts Pending */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Drafts Pending</span>
            <Pencil className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-3xl font-extrabold text-primary">{draftsCount}</div>
          <p className="text-xs text-amber-600 mt-1">Awaiting review</p>
        </div>

        {/* Weekly Views */}
        <div className="bg-white rounded-xl border-l-4 border-l-accent border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Weekly Views</span>
            <Eye className="w-5 h-5 text-accent" />
          </div>
          <div className="text-3xl font-extrabold text-primary">{formatNumber(weeklyViews)}</div>
          <p className="text-xs text-emerald-600 mt-1">+8% from last week</p>
        </div>

        {/* Trending Topic */}
        <div className="bg-gradient-to-br from-accent to-violet-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Trending Topic</span>
            <Flame className="w-5 h-5 text-white/80" />
          </div>
          <div className="text-lg font-extrabold leading-tight">Summer Jam Festival 2024</div>
          <p className="text-xs text-white/70 mt-1">
            <TrendingUp className="w-3 h-3 inline mr-1" />Highest engagement this week
          </p>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl border border-gray-100 mb-8">
        {/* Tabs & View Toggle */}
        <div className="flex items-center justify-between px-6 border-b border-gray-100">
          <div className="flex gap-6">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setCurrentPage(1) }}
                className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-accent text-accent'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-gray-100 text-primary' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-gray-100 text-primary' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {viewMode === 'list' ? (
          <>
            {/* Table */}
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {['TITLE', 'AUTHOR', 'PUBLISH DATE', 'FEATURED STATUS', 'LIVE', 'ACTIONS'].map(h => (
                    <th key={h} className="text-left px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map(article => (
                  <tr key={article.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    {/* Title */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5 text-gray-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-primary truncate max-w-[260px]">{article.title || article.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${tagColors[article.tag] || 'bg-gray-100 text-gray-600'}`}>
                              {article.tag}
                            </span>
                            <span className="text-xs text-gray-400">{formatNumber(article.views || 0)} views</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Author */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-300 to-blue-400 flex items-center justify-center text-white text-[10px] font-bold">
                          {getInitials(article.author)}
                        </div>
                        <span className="text-sm text-gray-700">{article.author}</span>
                      </div>
                    </td>

                    {/* Publish Date */}
                    <td className="px-6 py-4">
                      {article.draft ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                          DRAFT
                        </span>
                      ) : article.date ? (
                        <div>
                          <p className="text-sm text-gray-700">{formatDate(article.date)}</p>
                          <p className="text-xs text-gray-400">{formatTime(article.date)}</p>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">--</span>
                      )}
                    </td>

                    {/* Featured Status */}
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleFeatured(article)}
                        className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md cursor-pointer transition-colors ${
                          article.featured
                            ? 'bg-accent/10 text-accent border border-accent/20'
                            : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        <Star className={`w-3 h-3 ${article.featured ? 'fill-accent' : ''}`} />
                        {article.featured ? 'Featured' : 'Standard'}
                      </button>
                    </td>

                    {/* Live Toggle */}
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleLive(article)}
                        className={`w-10 h-5 rounded-full relative transition-colors ${
                          article.live ? 'bg-emerald-500' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                            article.live ? 'left-5' : 'left-0.5'
                          }`}
                        />
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(article)}
                          className="p-1.5 text-gray-400 hover:text-accent hover:bg-accent/10 rounded-lg transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(article.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {paginatedItems.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-sm">No articles found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </>
        ) : (
          /* Grid View */
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 p-6">
            {paginatedItems.map(article => (
              <div key={article.id} className="border border-gray-100 rounded-xl p-4 hover:shadow-md transition-shadow">
                <div className="w-full h-28 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
                  <FileText className="w-8 h-8 text-gray-300" />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${tagColors[article.tag] || 'bg-gray-100 text-gray-600'}`}>
                    {article.tag}
                  </span>
                  {article.featured && (
                    <Star className="w-3.5 h-3.5 text-accent fill-accent" />
                  )}
                </div>
                <h4 className="text-sm font-semibold text-primary leading-tight mb-1 line-clamp-2">{article.title || article.name}</h4>
                <p className="text-xs text-gray-400 mb-3">
                  {article.author} &middot; {article.draft ? 'Draft' : formatDate(article.date)} &middot; {formatNumber(article.views || 0)} views
                </p>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleEdit(article)} className="p-1.5 text-gray-400 hover:text-accent hover:bg-accent/10 rounded-lg">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDeleteClick(article.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => toggleLive(article)}
                    className={`ml-auto text-[9px] font-bold uppercase px-2 py-0.5 rounded ${article.live ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}
                  >
                    {article.live ? 'Live' : 'Off'}
                  </button>
                </div>
              </div>
            ))}
            {paginatedItems.length === 0 && (
              <div className="col-span-full py-12 text-center text-gray-400 text-sm">No articles found.</div>
            )}
          </div>
        )}

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          startIndex={startIndex}
          endIndex={endIndex}
          onPageChange={setCurrentPage}
          label="articles"
        />
      </div>


      {/* Modals */}
      <ArticleModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditArticle(null) }}
        onSubmit={handleSubmit}
        article={editArticle}
      />
      <ConfirmDialog
        isOpen={showConfirm}
        onConfirm={handleDeleteConfirm}
        onCancel={() => { setShowConfirm(false); setDeleteId(null) }}
        title="Delete Article"
        message="Are you sure you want to delete this article? This action cannot be undone."
      />
    </Layout>
  )
}
