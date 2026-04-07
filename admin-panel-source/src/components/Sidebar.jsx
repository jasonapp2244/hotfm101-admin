import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth, canAccess } from '../contexts/AuthContext'
import { useData } from '../contexts/DataContext'
import {
  LayoutDashboard, Users, FileText, Trophy, CalendarDays,
  MessageCircle, Bell, Megaphone, Video, HelpCircle, LogOut, Radio
} from 'lucide-react'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard',     path: '/dashboard'   },
  { icon: Users,           label: 'Users',          path: '/users'       },
  { icon: FileText,        label: 'Content',        path: '/content'     },
  { icon: Trophy,          label: 'Contests',       path: '/contests'    },
  { icon: CalendarDays,    label: 'Events',         path: '/events'      },
  { icon: MessageCircle,   label: 'Shoutouts',      path: '/shoutouts',  badgeKey: 'shoutouts' },
  { icon: Megaphone,       label: 'Ads',            path: '/ads'         },
  { icon: Video,           label: 'Broadcasting',   path: '/broadcasting'},
  { icon: Bell,            label: 'Notifications',  path: '/notifications'},
]

const roleBadgeColors = {
  'super admin': 'bg-red-100 text-red-700',
  'admin':       'bg-blue-100 text-blue-700',
  'editor':      'bg-emerald-100 text-emerald-700',
  'staff':       'bg-purple-100 text-purple-700',
  'listener':    'bg-gray-100 text-gray-600',
}

export default function Sidebar() {
  const { user, logout } = useAuth()
  const { shoutouts } = useData()
  const navigate = useNavigate()

  const pendingCount = shoutouts.filter(s => s.status === 'pending').length
  const roleNorm = user?.roleNorm || ''
  const roleBadge = roleBadgeColors[roleNorm] || 'bg-gray-100 text-gray-600'

  // Only show nav items the current role can access
  const visibleNav = navItems.filter(item => canAccess(roleNorm, item.path))

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="w-56 bg-white border-r border-gray-100 flex flex-col min-h-screen shrink-0">
      {/* Logo */}
      <div className="px-5 py-6 flex items-center gap-3">
        <div className="w-9 h-9 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
          <Radio className="w-4.5 h-4.5 text-white" />
        </div>
        <div>
          <div className="text-sm font-bold text-primary">Hot FM 101.5</div>
          <div className="text-[10px] text-gray-400 uppercase tracking-[0.15em] font-semibold">Sonic Command</div>
        </div>
      </div>

      {/* Logged-in user info */}
      {user && (
        <div className="mx-3 mb-3 px-3 py-2.5 bg-gray-50 rounded-xl">
          <div className="text-xs font-semibold text-primary truncate">{user.name}</div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${roleBadge}`}>
              {user.role}
            </span>
          </div>
        </div>
      )}

      {/* Navigation — filtered by role */}
      <nav className="flex-1 px-3 mt-1">
        {visibleNav.map(({ icon: Icon, label, path, badgeKey }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-0.5 ${
                isActive ? 'bg-blue-50 text-accent' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <Icon className="w-[18px] h-[18px]" />
            {label}
            {badgeKey === 'shoutouts' && pendingCount > 0 && (
              <span className="ml-auto bg-accent text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {pendingCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-6 border-t border-gray-100 pt-4 space-y-1">
        <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 w-full transition-colors">
          <HelpCircle className="w-[18px] h-[18px]" />
          Help
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 w-full transition-colors"
        >
          <LogOut className="w-[18px] h-[18px]" />
          Logout
        </button>
      </div>
    </aside>
  )
}
