import { useNavigate } from 'react-router-dom'
import {
  Users, Trophy, CalendarDays, FileCheck, Send,
  UserPlus, Mic, PenLine, Bell, Pause
} from 'lucide-react'
import Layout from '../components/Layout'
import { useData } from '../contexts/DataContext'
import { formatRelativeTime } from '../utils/formatters'

const iconMap = {
  user: UserPlus,
  contest: Trophy,
  shoutout: Mic,
  event: CalendarDays,
  content: PenLine,
  notification: Send,
}
const iconBgMap = {
  user: 'bg-blue-50 text-accent',
  contest: 'bg-indigo-50 text-indigo-600',
  shoutout: 'bg-pink-50 text-pink-600',
  event: 'bg-amber-50 text-amber-600',
  content: 'bg-emerald-50 text-emerald-600',
  notification: 'bg-violet-50 text-violet-600',
}

export default function Dashboard() {
  const { users, contests, events, shoutouts, notifications, activityLog } = useData()
  const navigate = useNavigate()

  const today = new Date().toISOString().split('T')[0]
  const activeContests = contests.filter(c => c.status === 'Active').length
  const upcomingEvents = events.filter(e => e.date >= today).length
  const pendingReviews = shoutouts.filter(s => s.status === 'pending').length
  const todayNotifs = notifications.filter(n => {
    const d = new Date(n.date)
    return d.toDateString() === new Date().toDateString()
  }).length

  const stats = [
    { icon: Users, label: 'TOTAL USERS', value: users.length.toLocaleString(), badge: '+12%', badgeColor: 'text-emerald-600', borderColor: 'border-t-accent' },
    { icon: Trophy, label: 'ACTIVE CONTESTS', value: String(activeContests).padStart(2, '0'), badge: `${activeContests} Live`, badgeColor: 'text-accent', borderColor: 'border-t-accent' },
    { icon: CalendarDays, label: 'UPCOMING EVENTS', value: String(upcomingEvents).padStart(2, '0'), badge: 'This Week', badgeColor: 'text-gray-500', borderColor: 'border-t-emerald-500' },
    { icon: FileCheck, label: 'PENDING REVIEWS', value: String(pendingReviews).padStart(2, '0'), badge: pendingReviews > 10 ? 'Urgent' : 'Normal', badgeColor: pendingReviews > 10 ? 'text-red-600' : 'text-gray-500', borderColor: 'border-t-red-500' },
    { icon: Send, label: 'PUSHES TODAY', value: String(todayNotifs).padStart(2, '0'), badge: 'Goal Met', badgeColor: 'text-emerald-600', borderColor: 'border-t-violet-500' },
  ]

  const recentActivity = activityLog.slice(0, 5)

  const quickActions = [
    { icon: PenLine, label: 'Write Article', path: '/content' },
    { icon: Bell, label: 'Send Notification', path: '/notifications' },
    { icon: Mic, label: 'Review Shoutouts', path: '/shoutouts' },
  ]

  return (
    <Layout breadcrumb={['Admin', 'Dashboard Overview']} searchPlaceholder="Search the station archive...">
      <h2 className="text-3xl font-extrabold text-primary mb-1">Morning Shift Status</h2>
      <p className="text-gray-500 mb-8">Pulse check for Hot 101.5 broadcast operations and digital engagement.</p>

      {/* Stats Cards */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        {stats.map(({ icon: Icon, label, value, badge, badgeColor, borderColor }) => (
          <div key={label} className={`bg-white rounded-xl border border-gray-100 p-5 border-t-3 ${borderColor}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <span className={`text-xs font-semibold ${badgeColor}`}>{badge}</span>
            </div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</div>
            <div className="text-3xl font-extrabold text-primary">{value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Live Stream Activity */}
        <div className="col-span-2 bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-primary">Live Stream Activity</h3>
            <button className="text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-gray-600">View History</button>
          </div>
          <div className="space-y-5">
            {recentActivity.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No recent activity.</p>}
            {recentActivity.map((item) => {
              const Icon = iconMap[item.type] || Send
              const bg = iconBgMap[item.type] || 'bg-gray-50 text-gray-600'
              return (
                <div key={item.id} className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${bg}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700">{item.text}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatRelativeTime(item.time)}</p>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md shrink-0 ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <div className="bg-dark-navy rounded-xl p-6 text-white">
            <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              {quickActions.map(({ icon: Icon, label, path }) => (
                <button
                  key={label}
                  onClick={() => navigate(path)}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-white/10 hover:bg-white/15 rounded-xl text-sm font-medium transition-colors cursor-pointer"
                >
                  <Icon className="w-4.5 h-4.5 text-blue-300" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-dark-navy rounded-xl p-6 text-white">
            <h3 className="text-lg font-bold mb-2">Engage Pulse</h3>
            <p className="text-sm text-gray-300 mb-4">
              Listener engagement is up <strong className="text-white">18.4%</strong> since the "Summer Jams" rollout.
            </p>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="uppercase tracking-wider text-gray-400">Mobile App</span>
                <span>72%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-1.5">
                <div className="bg-accent h-1.5 rounded-full" style={{ width: '72%' }} />
              </div>
              <div className="flex justify-between text-xs font-semibold mt-3">
                <span className="uppercase tracking-wider text-gray-400">Web Player</span>
                <span>28%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-1.5">
                <div className="bg-indigo-400 h-1.5 rounded-full" style={{ width: '28%' }} />
              </div>
            </div>
            <div className="mt-5 bg-white/10 rounded-xl p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">On Air Now</div>
                <div className="text-sm font-semibold truncate">Solaris - Midnight City</div>
              </div>
              <Pause className="w-5 h-5 text-white shrink-0" />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
