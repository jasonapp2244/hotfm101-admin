import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart3, Eye, MousePointer, MapPin, Bell, Navigation,
  TrendingUp, TrendingDown, ArrowLeft, Download, Calendar, Filter
} from 'lucide-react'
import Layout from '../components/Layout'
import { useData } from '../contexts/DataContext'
import { formatNumber, formatDate } from '../utils/formatters'
import { exportCSV } from '../utils/csv'

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function AdAnalytics() {
  const { ads, adAnalytics } = useData()
  const navigate = useNavigate()
  const [dateRange, setDateRange] = useState('7d')

  // Aggregate totals
  const totals = useMemo(() => {
    const t = { impressions: 0, clicks: 0, geofenceEntries: 0, notificationOpens: 0, directionRequests: 0 }
    Object.values(adAnalytics).forEach(a => {
      t.impressions += a.impressions
      t.clicks += a.clicks
      t.geofenceEntries += a.geofenceEntries
      t.notificationOpens += a.notificationOpens
      t.directionRequests += a.directionRequests
    })
    t.ctr = t.impressions > 0 ? ((t.clicks / t.impressions) * 100).toFixed(2) : '0.00'
    return t
  }, [adAnalytics])

  // Top ad by impressions for chart
  const topAdEntry = useMemo(() => {
    let best = null
    let bestId = null
    Object.entries(adAnalytics).forEach(([id, data]) => {
      if (!best || data.impressions > best.impressions) {
        best = data
        bestId = id
      }
    })
    return { id: bestId, data: best }
  }, [adAnalytics])

  const topAd = ads.find(a => a.id === topAdEntry.id)
  const dailyData = topAdEntry.data?.daily || []
  const maxImpression = Math.max(...dailyData.map(d => d.impressions), 1)

  // Ads sorted by CTR
  const sortedAds = useMemo(() => {
    return ads
      .map(ad => {
        const analytics = adAnalytics[ad.id] || { impressions: 0, clicks: 0, geofenceEntries: 0, notificationOpens: 0, directionRequests: 0, daily: [] }
        const ctr = analytics.impressions > 0 ? (analytics.clicks / analytics.impressions) * 100 : 0
        return { ...ad, analytics, ctr }
      })
      .filter(a => a.analytics.impressions > 0)
      .sort((a, b) => b.ctr - a.ctr)
  }, [ads, adAnalytics])

  // Funnel data
  const funnel = [
    { label: 'Impressions', value: totals.impressions, color: 'bg-blue-500' },
    { label: 'Clicks', value: totals.clicks, color: 'bg-indigo-500' },
    { label: 'Geofence Entries', value: totals.geofenceEntries, color: 'bg-purple-500' },
    { label: 'Notif. Opens', value: totals.notificationOpens, color: 'bg-pink-500' },
    { label: 'Directions', value: totals.directionRequests, color: 'bg-rose-500' },
  ]

  const handleExport = () => {
    const rows = sortedAds.map((a, i) => ({
      rank: i + 1,
      title: a.title,
      impressions: a.analytics.impressions,
      clicks: a.analytics.clicks,
      ctr: a.ctr.toFixed(2) + '%',
      geofenceEntries: a.analytics.geofenceEntries,
      notificationOpens: a.analytics.notificationOpens,
      directionRequests: a.analytics.directionRequests,
    }))
    exportCSV(rows, [
      { label: 'Rank', key: 'rank' },
      { label: 'Ad Name', key: 'title' },
      { label: 'Impressions', key: 'impressions' },
      { label: 'Clicks', key: 'clicks' },
      { label: 'CTR', key: 'ctr' },
      { label: 'Geofence Entries', key: 'geofenceEntries' },
      { label: 'Notif Opens', key: 'notificationOpens' },
      { label: 'Directions', key: 'directionRequests' },
    ], 'ad-analytics.csv')
  }

  const overviewCards = [
    { label: 'Total Impressions', value: formatNumber(totals.impressions), icon: Eye, color: 'text-blue-500', borderColor: 'border-t-blue-500', change: '+12.4%', up: true },
    { label: 'Total Clicks', value: formatNumber(totals.clicks), icon: MousePointer, color: 'text-indigo-500', borderColor: 'border-t-indigo-500', change: '+8.2%', up: true },
    { label: 'Avg CTR', value: totals.ctr + '%', icon: TrendingUp, color: 'text-emerald-500', borderColor: 'border-t-emerald-500', change: '+1.3%', up: true },
    { label: 'Geofence Entries', value: formatNumber(totals.geofenceEntries), icon: MapPin, color: 'text-purple-500', borderColor: 'border-t-purple-500', change: '+15.7%', up: true },
    { label: 'Notification Opens', value: formatNumber(totals.notificationOpens), icon: Bell, color: 'text-pink-500', borderColor: 'border-t-pink-500', change: '-2.1%', up: false },
    { label: 'Direction Requests', value: formatNumber(totals.directionRequests), icon: Navigation, color: 'text-rose-500', borderColor: 'border-t-rose-500', change: '+6.8%', up: true },
  ]

  return (
    <Layout breadcrumb={['Station Hub', 'Ads Management', 'Analytics']}>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/ads')}
            className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-3xl font-extrabold text-primary mb-1">Ad Analytics</h2>
            <p className="text-gray-500">Campaign performance metrics and engagement insights.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Date range toggle */}
          <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
            {[{ key: '7d', label: '7 Days' }, { key: '30d', label: '30 Days' }, { key: 'all', label: 'All Time' }].map(r => (
              <button
                key={r.key}
                onClick={() => setDateRange(r.key)}
                className={`px-4 py-2.5 text-sm font-medium flex items-center gap-1.5 ${dateRange === r.key ? 'bg-accent text-white' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                {r.key === '7d' && <Calendar className="w-3.5 h-3.5" />}
                {r.label}
              </button>
            ))}
          </div>
          <button onClick={handleExport} className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-6 gap-4 mb-8">
        {overviewCards.map(card => (
          <div key={card.label} className={`bg-white rounded-2xl border border-gray-100 p-5 border-t-3 ${card.borderColor}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{card.label}</span>
              <card.icon className={`w-5 h-5 ${card.color}`} />
            </div>
            <div className="text-2xl font-extrabold text-primary">{card.value}</div>
            <div className="flex items-center gap-1 mt-1.5">
              {card.up ? <TrendingUp className="w-3 h-3 text-emerald-500" /> : <TrendingDown className="w-3 h-3 text-red-500" />}
              <span className={`text-xs font-semibold ${card.up ? 'text-emerald-600' : 'text-red-500'}`}>{card.change}</span>
              <span className="text-xs text-gray-400">vs last period</span>
            </div>
          </div>
        ))}
      </div>

      {/* Performance Chart + Funnel row */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Bar Chart */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-primary">Daily Performance (Last 7 Days)</h3>
              <p className="text-xs text-gray-400 mt-0.5">{topAd?.title || 'Top Campaign'}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="text-xs text-gray-500">Impressions</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-orange-400" />
                <span className="text-xs text-gray-500">Clicks</span>
              </div>
            </div>
          </div>
          {/* Chart */}
          <div className="relative">
            {/* Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className="border-b border-dashed border-gray-100 w-full" />
              ))}
            </div>
            <div className="flex items-end justify-between gap-3" style={{ height: 200 }}>
              {dailyData.map((d, i) => {
                const impH = (d.impressions / maxImpression) * 100
                const clickH = (d.clicks / maxImpression) * 100
                const dayLabel = dayNames[new Date(d.date).getDay()]
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="flex items-end gap-1 w-full justify-center" style={{ height: 170 }}>
                      <div
                        className="w-5 bg-blue-500 rounded-t-md transition-all"
                        style={{ height: `${impH}%`, minHeight: 4 }}
                        title={`${d.impressions} impressions`}
                      />
                      <div
                        className="w-5 bg-orange-400 rounded-t-md transition-all"
                        style={{ height: `${clickH}%`, minHeight: 4 }}
                        title={`${d.clicks} clicks`}
                      />
                    </div>
                    <span className="text-[10px] font-medium text-gray-400">{dayLabel}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Conversion Funnel */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-primary mb-6">Engagement Funnel</h3>
          <div className="flex flex-col gap-4">
            {funnel.map((step, i) => {
              const widthPct = totals.impressions > 0 ? Math.max((step.value / totals.impressions) * 100, 4) : 4
              const nextStep = funnel[i + 1]
              const convRate = nextStep && step.value > 0 ? ((nextStep.value / step.value) * 100).toFixed(1) : null
              return (
                <div key={step.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-semibold text-gray-700">{step.label}</span>
                    <span className="text-sm font-bold text-primary">{formatNumber(step.value)}</span>
                  </div>
                  <div className="w-full bg-gray-50 rounded-full h-8 overflow-hidden">
                    <div
                      className={`${step.color} h-full rounded-full flex items-center justify-end pr-3 transition-all`}
                      style={{ width: `${widthPct}%` }}
                    >
                      {widthPct > 15 && (
                        <span className="text-[10px] font-bold text-white">{((step.value / totals.impressions) * 100).toFixed(1)}%</span>
                      )}
                    </div>
                  </div>
                  {convRate && (
                    <div className="text-[10px] text-gray-400 mt-1 text-right">
                      {convRate}% conversion to {nextStep.label}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Top Performing Ads Table */}
      <div className="bg-white rounded-2xl border border-gray-100 mb-8">
        <div className="px-6 py-5 border-b border-gray-100">
          <h3 className="text-lg font-bold text-primary">Campaign Performance Breakdown</h3>
          <p className="text-xs text-gray-400 mt-0.5">All campaigns sorted by click-through rate</p>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              {['#', 'AD NAME', 'IMPRESSIONS', 'CLICKS', 'CTR', 'GEOFENCE', 'NOTIF OPENS', 'DIRECTIONS', 'PERFORMANCE'].map(h => (
                <th key={h} className="text-left px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedAds.map((ad, i) => {
              const a = ad.analytics
              const daily = a.daily || []
              const maxD = Math.max(...daily.map(d => d.impressions), 1)
              return (
                <tr key={ad.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-gray-400">{i + 1}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {ad.images && ad.images.length > 0 ? (
                        <img src={ad.images[0]} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="w-9 h-9 bg-gradient-to-br from-blue-200 to-purple-300 rounded-lg shrink-0 flex items-center justify-center">
                          <BarChart3 className="w-4 h-4 text-blue-700" />
                        </div>
                      )}
                      <div className="text-sm font-semibold text-primary">{ad.title}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-700">{formatNumber(a.impressions)}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-700">{formatNumber(a.clicks)}</td>
                  <td className="px-6 py-4">
                    <div className="relative w-24">
                      <div className="absolute inset-0 bg-gray-100 rounded-full h-6" />
                      <div
                        className="absolute left-0 top-0 h-6 bg-emerald-100 rounded-full"
                        style={{ width: `${Math.min(ad.ctr * 4, 100)}%` }}
                      />
                      <span className="relative z-10 flex items-center justify-center h-6 text-xs font-bold text-emerald-700">
                        {ad.ctr.toFixed(2)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-700">{formatNumber(a.geofenceEntries)}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-700">{formatNumber(a.notificationOpens)}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-700">{formatNumber(a.directionRequests)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-end gap-0.5 h-5">
                      {daily.slice(-7).map((d, j) => (
                        <div
                          key={j}
                          className="w-1.5 bg-accent/60 rounded-full"
                          style={{ height: `${Math.max((d.impressions / maxD) * 100, 10)}%` }}
                        />
                      ))}
                    </div>
                  </td>
                </tr>
              )
            })}
            {sortedAds.length === 0 && (
              <tr><td colSpan={9} className="px-6 py-12 text-center text-sm text-gray-400">No analytics data available.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Location Engagement */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-primary mb-4">Location Engagement</h3>
        <div className="grid grid-cols-3 gap-6">
          {sortedAds.map(ad => {
            const a = ad.analytics
            const notifRate = a.geofenceEntries > 0 ? ((a.notificationOpens / a.geofenceEntries) * 100).toFixed(1) : '0.0'
            const dirRate = a.notificationOpens > 0 ? ((a.directionRequests / a.notificationOpens) * 100).toFixed(1) : '0.0'
            const overallConv = a.geofenceEntries > 0 ? (a.directionRequests / a.geofenceEntries) * 100 : 0
            const indicator = overallConv >= 20 ? 'bg-emerald-500' : overallConv >= 10 ? 'bg-amber-400' : 'bg-red-400'
            return (
              <div key={ad.id} className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-sm font-bold text-primary">{ad.title}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{ad.address}</div>
                  </div>
                  <div className={`w-2.5 h-2.5 rounded-full mt-1.5 ${indicator}`} />
                </div>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <MapPin className="w-3.5 h-3.5 text-purple-500" />
                      Geofence Entries
                    </div>
                    <span className="text-sm font-bold text-primary">{formatNumber(a.geofenceEntries)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Bell className="w-3.5 h-3.5 text-pink-500" />
                      Notification Open Rate
                    </div>
                    <span className="text-sm font-bold text-primary">{notifRate}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Navigation className="w-3.5 h-3.5 text-rose-500" />
                      Direction Request Rate
                    </div>
                    <span className="text-sm font-bold text-primary">{dirRate}%</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </Layout>
  )
}
