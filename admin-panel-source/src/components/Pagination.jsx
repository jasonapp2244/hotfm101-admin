import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({ currentPage, totalPages, totalItems, startIndex, endIndex, onPageChange, label = 'items' }) {
  const pages = []
  for (let i = 1; i <= Math.min(totalPages, 3); i++) pages.push(i)
  if (totalPages > 4) pages.push('...')
  if (totalPages > 3) pages.push(totalPages)

  return (
    <div className="flex items-center justify-between px-6 py-4">
      <span className="text-sm text-gray-500">
        Showing <strong>{startIndex}-{endIndex}</strong> of <strong>{totalItems}</strong> {label}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-50 disabled:opacity-30"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={i} className="text-gray-400 px-1">...</span>
          ) : (
            <button
              key={i}
              onClick={() => onPageChange(p)}
              className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium ${
                p === currentPage ? 'bg-accent text-white' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-50 disabled:opacity-30"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
