import { Search, Bell, Settings, Radio, ChevronRight } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { getInitials } from '../utils/formatters'
import Sidebar from './Sidebar'

export default function Layout({ children, breadcrumb = [], searchPlaceholder = 'Search...', searchValue = '', onSearchChange }) {
  const { user } = useAuth()

  return (
    <div className="flex min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold text-primary">Command Center</h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={e => onSearchChange?.(e.target.value)}
                className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm w-72 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent placeholder:text-gray-400"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
              <Radio className="w-4 h-4 text-emerald-500" />
              On-Air Live
            </button>
            <button className="p-2 text-gray-500 hover:bg-gray-50 rounded-lg"><Bell className="w-5 h-5" /></button>
            <button className="p-2 text-gray-500 hover:bg-gray-50 rounded-lg"><Settings className="w-5 h-5" /></button>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-primary">{user?.name || 'Admin'}</span>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-sm font-semibold">
                {getInitials(user?.name || 'A')}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-auto">
          {breadcrumb.length > 0 && (
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
              {breadcrumb.map((item, i) => (
                <span key={i} className="flex items-center gap-2">
                  {i > 0 && <ChevronRight className="w-3 h-3" />}
                  <span className={i === breadcrumb.length - 1 ? 'text-primary' : ''}>{item}</span>
                </span>
              ))}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  )
}
