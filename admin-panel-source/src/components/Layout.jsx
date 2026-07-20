import { useState, useEffect } from 'react'
import { Search, Settings, ChevronRight, User, LogOut, Moon, ShieldCheck } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { getInitials } from '../utils/formatters'
import Sidebar from './Sidebar'
import EditProfileModal from './EditProfileModal'
import SecurityPrivacyModal from './SecurityPrivacyModal'

export default function Layout({ children, breadcrumb = [], searchPlaceholder = 'Search...', searchValue = '', onSearchChange }) {
  const { user, logout } = useAuth()
  const { dark, toggleDark } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [securityOpen, setSecurityOpen] = useState(false)
  useEffect(() => {
    function closeAll() { setSettingsOpen(false); setMenuOpen(false) }
    document.addEventListener('click', closeAll)
    return () => document.removeEventListener('click', closeAll)
  }, [])

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
            {/* Settings icon with dropdown */}
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setSettingsOpen(prev => !prev); setMenuOpen(false) }}
                className={`p-2 rounded-lg transition-colors ${settingsOpen ? 'bg-gray-100 text-primary' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                <Settings className="w-5 h-5" />
              </button>

              {settingsOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden" onClick={e => e.stopPropagation()}>
                  <div className="px-4 py-2.5 border-b border-gray-100">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Settings</p>
                  </div>
                  <div className="py-1">
                    {/* Dark Mode toggle */}
                    <button
                      onClick={toggleDark}
                      className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Moon className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700">Dark Mode</span>
                      </div>
                      {/* Toggle pill */}
                      <div className={`w-9 h-5 rounded-full relative transition-colors duration-200 ${dark ? 'bg-accent' : 'bg-gray-200'}`}>
                        <span
                          className="absolute top-0.5 w-4 h-4 rounded-full shadow transition-transform duration-200"
                          style={{ backgroundColor: '#ffffff', transform: dark ? 'translateX(16px)' : 'translateX(2px)' }}
                        />
                      </div>
                    </button>

                    {/* Security & Privacy */}
                    <button
                      onClick={() => { setSettingsOpen(false); setSecurityOpen(true) }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <ShieldCheck className="w-4 h-4 text-gray-400" />
                      Security &amp; Privacy
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Admin avatar with dropdown */}
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpen(prev => !prev); setSettingsOpen(false) }}
                className="flex items-center gap-2 cursor-pointer select-none rounded-lg px-1 py-1 hover:bg-gray-50 transition-colors"
              >
                <span className="text-sm font-semibold text-primary">{user?.name || 'Admin'}</span>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-sm font-semibold" style={{ color: '#ffffff' }}>
                  {getInitials(user?.name || 'A')}
                </div>
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden" onClick={e => e.stopPropagation()}>
                  {/* User info */}
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-bold text-gray-900">{user?.name || 'Admin'}</p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{user?.email || ''}</p>
                    <span className="inline-block mt-1.5 px-2 py-0.5 text-xs font-semibold text-accent bg-accent/10 rounded-full capitalize">
                      {user?.role || 'Admin'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="py-1">
                    <button
                      onClick={() => { setMenuOpen(false); setProfileOpen(true) }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <User className="w-4 h-4 text-gray-400" />
                      Edit Profile
                    </button>
                    <button
                      onClick={async () => { setMenuOpen(false); await logout() }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <EditProfileModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} />
        <SecurityPrivacyModal isOpen={securityOpen} onClose={() => setSecurityOpen(false)} />

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
