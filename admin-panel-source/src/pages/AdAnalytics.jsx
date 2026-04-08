import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart3, Eye, MousePointer, MapPin, Bell, Navigation,
  TrendingUp, TrendingDown, ArrowLeft, Download, Calendar
} from 'lucide-react'
import Layout from '../components/Layout'
import { useData } from '../contexts/DataContext'
import { formatNumber } from '../utils/formatters'
import { exportCSV } from '../utils/csv'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
// Weekend dip, weekday peak pattern
const DOW_WEIGHT = [0.70, 1.05, 1.10, 1.10, 1.05, 0.95, 0.75]

// Deterministic variation so data is stable across renders (no Math.random)
function deterministicFactor(seed, index) {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 1000
  const v = (h + index * 37) % 100
  return 0.78 + (v / 100) * 0.44 // 0.78 – 1.22 range
}

// Build N days of daily data going back from today, scaled from all-time totals
// We assume all-time totals span ~90 days to derive a per-day base rate
function buildDailyData(adId, allTimeTotals, days, offsetDays = 0) {
  const today = new Date()
  const TOTAL_SPAN = 90
  const base = {
    impressions: allTimeTotals.impressions / TOTAL_SPAN,
    clicks: allTimeTotals.clicks / TOTAL_SPAN,
    geofenceEntries: allTimeTotals.geofenceEntries / TOTAL_SPAN,
    notificationOpens: allTimeTotals.notificationOpens / TOTAL_SPAN,
    directionRequests: (allTimeTotals.directionRequests || 0) / TOTAL_SPAN,
  }

  const result = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i - offsetDays)
    const dow = d.getDay()
    const factor = deterministicFactor(adId, i + offsetDays) * DOW_WEIGHT[dow]
    result.push({
      date: d.toISOString().split('T')[0],
      impressions: Math.max(0, Math.round(base.impressions * factor)),
      clicks: Math.max(0, Math.round(base.clicks * factor)),
      geofenceEntries: Math.max(0, Math.round(base.geofenceEntries * factor)),
      notificationOpens: Math.max(0, Math.round(base.notificationOpens * factor)),
      directionRequests: Math.max(0, Math.round(base.directionRequests * factor)),
    })
  }
  return result
}

function sumDaily(daily) {
  return daily.reduce(
    (acc, d) => ({
      impressions: acc.impressions + d.impressions,
      clicks: acc.clicks + d.clicks,
      geofenceEntries: acc.geofenceEntries + d.geofenceEntries,
      notificationOpens: acc.notificationOpens + d.notificationOpens,
      directionRequests: acc.directionRequests + (d.directionRequests || 0),
    }),
    { impressions: 0, clicks: 0, geofenceEntries: 0, notificationOpens: 0, directionRequests: 0 }
  )
}

function pctChange(current, previous) {
  if (previous === 0) return current > 0 ? '+100.0' : '0.0'
  const pct = ((current - previous) / previous) * 100
  return (pct >= 0 ? '+' : '') + pct.toFixed(1)
}

export default function AdAnalytics() {
  const { ads, adAnalytics } = useData()
  const navigate = useNavigate()
  const [dateRange, setDateRange] = useState('7d')

  const rangeDays = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : null

  // Per-ad enriched data: all-time totals + period daily
  const enrichedAds = useMemo(() => {
    return ads.map(ad => {
      const allTime = adAnalytics[ad.id] || {
        impressions: 0, clicks: 0, geofenceEntries: 0,
        notificationOpens: 0, directionRequests: 0,
      }

      let periodDaily, prevPeriodDaily
      if (rangeDays) {
        periodDaily = buildDailyData(ad.id, allTime, rangeDays, 0)
        prevPeriodDaily = buildDailyData(ad.id, allTime, rangeDays, rangeDays)
      } else {
        // "All time" – use the 30-day synthetic as a visual representation
        periodDaily = buildDailyData(ad.id, allTime, 30, 0)
        prevPeriodDaily = buildDailyData(ad.id, allTime, 30, 30)
      }

      const periodTotals = rangeDays ? sumDaily(periodDaily) : { ...allTime, directionRequests: allTime.directionRequests || 0 }
      const prevTotals = sumDaily(prevPeriodDaily)

      const ctr = periodTotals.impressions > 0
        ? (periodTotals.clicks / periodTotals.impressions) * 100
        : 0

      return { ...ad, allTime, periodTotals, prevTotals, periodDaily, ctr }
    })
  }, [ads, adAnalytics, dateRange, rangeDays])

  // Aggregate totals across all ads for the selected period
  const totals = useMemo(() => {
    const t = enrichedAds.reduce(
      (acc, ad) => ({
        impressions: acc.impressions + ad.periodTotals.impressions,
        clicks: acc.clicks + ad.periodTotals.clicks,
        geofenceEntries: acc.geofenceEntries + ad.periodTotals.geofenceEntries,
        notificationOpens: acc.notificationOpens + ad.periodTotals.notificationOpens,
        directionRequests: acc.directionRequests + ad.periodTotals.directionRequests,
      }),
      { impressions: 0, clicks: 0, geofenceEntries: 0, notificationOpens: 0, directionRequests: 0 }
    )
    t.ctr = t.impressions > 0 ? ((t.clicks / t.impressions) * 100).toFixed(2) : '0.00'
    return t
  }, [enrichedAds])

  const prevTotals = useMemo(() => {
    return enrichedAds.reduce(
      (acc, ad) => ({
        impressions: acc.impressions + ad.prevTotals.impressions,
        clicks: acc.clicks + ad.prevTotals.clicks,
        geofenceEntries: acc.geofenceEntries + ad.prevTotals.geofenceEntries,
        notificationOpens: acc.notificationOpens + ad.prevTotals.notificationOpens,
        directionRequests: acc.directionRequests + (ad.prevTotals.directionRequests || 0),
      }),
      { impressions: 0, clicks: 0, geofenceEntries: 0, notificationOpens: 0, directionRequests: 0 }
    )
  }, [enrichedAds])

  // Top ad by period impressions for the chart
  const topAd = useMemo(() => {
    return enrichedAds.reduce((best, ad) => {
      if (!best || ad.periodTotals.impressions > best.periodTotals.impressions) return ad
      return best
    }, null)
  }, [enrichedAds])

  const chartDaily = topAd?.periodDaily || []
  const maxImpression = Math.max(...chartDaily.map(d => d.impressions), 1)
  const maxClicks = Math.max(...chartDaily.map(d => d.clicks), 1)

  // Ads sorted by period CTR descending, only those with impressions
  const sortedAds = useMemo(() => {
    return enrichedAds
      .filter(a => a.periodTotals.impressions > 0)
      .sort((a, b) => b.ctr - a.ctr)
  }, [enrichedAds])

  // Conversion funnel using period totals
  const funnel = [
    { label: 'Impressions', value: totals.impressions, color: 'bg-blue-500' },
    { label: 'Clicks', value: totals.clicks, color: 'bg-indigo-500' },
    { label: 'Geofence Entries', value: totals.geofenceEntries, color: 'bg-purple-500' },
    { label: 'Notif. Opens', value: totals.notificationOpens, color: 'bg-pink-500' },
    { label: 'Directions', value: totals.directionRequests, color: 'bg-rose-500' },
  ]

  const prevCtr = prevTotals.impressions > 0
    ? (prevTotals.clicks / prevTotals.impressions) * 100
    : 0
  const currentCtr = parseFloat(totals.ctr)

  const overviewCards = [
    {
      label: 'Total Impressions', value: formatNumber(totals.impressions),
      icon: Eye, color: 'text-blue-500', borderColor: 'border-t-blue-500',
      change: pctChange(totals.impressions, prevTotals.impressions),
      up: totals.impressions >= prevTotals.impressions,
    },
    {
      label: 'Total Clicks', value: formatNumber(totals.clicks),
      icon: MousePointer, color: 'text-indigo-500', borderColor: 'border-t-indigo-500',
      change: pctChange(totals.clicks, prevTotals.clicks),
      up: totals.clicks >= prevTotals.clicks,
    },
    {
      label: 'Avg CTR', value: totals.ctr + '%',
      icon: TrendingUp, color: 'text-emerald-500', borderColor: 'border-t-emerald-500',
      change: pctChange(currentCtr, prevCtr),
      up: currentCtr >= prevCtr,
    },
    {
      label: 'Geofence Entries', value: formatNumber(totals.geofenceEntries),
      icon: MapPin, color: 'text-purple-500', borderColor: 'border-t-purple-500',
      change: pctChange(totals.geofenceEntries, prevTotals.geofenceEntries),
      up: totals.geofenceEntries >= prevTotals.geofenceEntries,
    },
    {
      label: 'Notification Opens', value: formatNumber(totals.notificationOpens),
      icon: Bell, color: 'text-pink-500', borderColor: 'border-t-pink-500',
      change: pctChange(totals.notificationOpens, prevTotals.notificationOpens),
      up: totals.notificationOpens >= prevTotals.notificationOpens,
    },
    {
      label: 'Direction Requests', value: formatNumber(totals.directionRequests),
      icon: Navigation, color: 'text-rose-500', borderColor: 'border-t-rose-500',
      change: pctChange(totals.directionRequests, prevTotals.directionRequests),
      up: totals.directionRequests >= prevTotals.directionRequests,
    },
  ]

  const chartTitle = dateRange === '7d'
    ? 'Daily Performance (Last 7 Days)'
    : dateRange === '30d'
    ? 'Daily Performance (Last 30 Days)'
    : 'Daily Performance (Last 30 Days — All Time View)'

  const handleExport = () => {
    const rows = sortedAds.map((a, i) => ({
      rank: i + 1,
      title: a.title,
      impressions: a.periodTotals.impressions,
      clicks: a.periodTotals.clicks,
      ctr: a.ctr.toFixed(2) + '%',
      geofenceEntries: a.periodTotals.geofenceEntries,
      notificationOpens: a.periodTotals.notificationOpens,
      directionRequests: a.periodTotals.directionRequests,
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
            {[
              { key: '7d', label: '7 Days' },
              { key: '30d', label: '30 Days' },
              { key: 'all', label: 'All Time' },
            ].map(r => (
              <button
                key={r.key}
                onClick={() => setDateRange(r.key)}
                className={`px-4 py-2.5 text-sm font-medium flex items-center gap-1.5 transition-colors ${
                  dateRange === r.key ? 'bg-accent text-white' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {r.key === '7d' && <Calendar className="w-3.5 h-3.5" />}
                {r.label}
              </button>
            ))}
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Period label */}
      <div className="mb-6 flex items-center gap-2">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
          Showing:
        </span>
        <span className="text-xs font-bold text-accent bg-accent/10 px-3 py-1 rounded-full">
          {dateRange === '7d' ? 'Last 7 Days' : dateRange === '30d' ? 'Last 30 Days' : 'All Time'}
        </span>
        <span className="text-xs text-gray-400">— compared to previous period</span>
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
              {card.up
                ? <TrendingUp className="w-3 h-3 text-emerald-500" />
                : <TrendingDown className="w-3 h-3 text-red-500" />
              }
              <span className={`text-xs font-semibold ${card.up ? 'text-emerald-600' : 'text-red-500'}`}>
                {card.change}%
              </span>
              <span className="text-xs text-gray-400">vs prev period</span>
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
              <h3 className="text-lg font-bold text-primary">{chartTitle}</h3>
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
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className="border-b border-dashed border-gray-100 w-full" />
              ))}
            </div>
            <div
              className="flex items-end justify-between gap-1"
              style={{ height: 200 }}
            >
              {chartDaily.map((d, i) => {
                const impH = Math.max((d.impressions / maxImpression) * 100, 3)
                const clickH = Math.max((d.clicks / maxImpression) * 100, 2)
                const isToday = i === chartDaily.length - 1
                const label = dateRange === '30d'
                  ? (i % 5 === 0 ? new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '')
                  : DAY_NAMES[new Date(d.date).getDay()]
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                    <div className="flex items-end gap-0.5 w-full justify-center" style={{ height: 170 }}>
                      <div
                        className={`rounded-t-md transition-all ${isToday ? 'bg-blue-600' : 'bg-blue-400'}`}
                        style={{ height: `${impH}%`, minHeight: 3, width: dateRange === '30d' ? 6 : 14 }}
                        title={`${d.date}: ${d.impressions} impressions`}
                      />
                      <div
                        className={`rounded-t-md transition-all ${isToday ? 'bg-orange-500' : 'bg-orange-300'}`}
                        style={{ height: `${clickH}%`, minHeight: 2, width: dateRange === '30d' ? 5 : 12 }}
                        title={`${d.date}: ${d.clicks} clicks`}
                      />
                    </div>
                    {label && (
                      <span className="text-[9px] font-medium text-gray-400 truncate max-w-full text-center leading-tight">
                        {label}
                      </span>
                    )}
                    {!label && dateRange !== '30d' && (
                      <span className="text-[10px] font-medium text-gray-400">
                        {DAY_NAMES[new Date(d.date).getDay()]}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Chart footer summary */}
          <div className="mt-4 pt-4 border-t border-gray-50 grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-gray-400">Period Impressions</div>
              <div className="text-lg font-bold text-primary">
                {formatNumber(chartDaily.reduce((s, d) => s + d.impressions, 0))}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Period Clicks</div>
              <div className="text-lg font-bold text-primary">
                {formatNumber(chartDaily.reduce((s, d) => s + d.clicks, 0))}
              </div>
            </div>
          </div>
        </div>

        {/* Conversion Funnel */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-primary mb-1">Engagement Funnel</h3>
          <p className="text-xs text-gray-400 mb-6">
            {dateRange === '7d' ? 'Last 7 days' : dateRange === '30d' ? 'Last 30 days' : 'All time'} — across all campaigns
          </p>
          <div className="flex flex-col gap-4">
            {funnel.map((step, i) => {
              const widthPct = totals.impressions > 0
                ? Math.max((step.value / totals.impressions) * 100, 4)
                : 4
              const nextStep = funnel[i + 1]
              const convRate = nextStep && step.value > 0
                ? ((nextStep.value / step.value) * 100).toFixed(1)
                : null
              return (
                <div key={step.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-semibold text-gray-700">{step.label}</span>
                    <span className="text-sm font-bold text-primary">{formatNumber(step.value)}</span>
                  </div>
                  <div className="w-full bg-gray-50 rounded-full h-8 overflow-hidden">
                    <div
                      className={`${step.color} h-full rounded-full flex items-center justify-end pr-3 transition-all duration-500`}
                      style={{ width: `${widthPct}%` }}
                    >
                      {widthPct > 15 && (
                        <span className="text-[10px] font-bold text-white">
                          {((step.value / totals.impressions) * 100).toFixed(1)}%
                        </span>
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
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-primary">Campaign Performance Breakdown</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Sorted by CTR for{' '}
              {dateRange === '7d' ? 'the last 7 days' : dateRange === '30d' ? 'the last 30 days' : 'all time'}
            </p>
          </div>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              {['#', 'AD NAME', 'IMPRESSIONS', 'CLICKS', 'CTR', 'GEOFENCE', 'NOTIF OPENS', 'DIRECTIONS', 'TREND'].map(h => (
                <th key={h} className="text-left px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedAds.map((ad, i) => {
              const p = ad.periodTotals
              const daily = ad.periodDaily || []
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
                      <div>
                        <div className="text-sm font-semibold text-primary">{ad.title}</div>
                        <div className="text-xs text-gray-400">{ad.businessName}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-700">{formatNumber(p.impressions)}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-700">{formatNumber(p.clicks)}</td>
                  <td className="px-6 py-4">
                    <div className="relative w-24">
                      <div className="absolute inset-0 bg-gray-100 rounded-full h-6" />
                      <div
                        className="absolute left-0 top-0 h-6 bg-emerald-100 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(ad.ctr * 4, 100)}%` }}
                      />
                      <span className="relative z-10 flex items-center justify-center h-6 text-xs font-bold text-emerald-700">
                        {ad.ctr.toFixed(2)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-700">{formatNumber(p.geofenceEntries)}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-700">{formatNumber(p.notificationOpens)}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-700">{formatNumber(p.directionRequests)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-end gap-0.5 h-6">
                      {daily.slice(-14).map((d, j) => (
                        <div
                          key={j}
                          className="w-1.5 bg-accent/60 rounded-full transition-all"
                          style={{ height: `${Math.max((d.impressions / maxD) * 100, 8)}%` }}
                        />
                      ))}
                    </div>
                  </td>
                </tr>
              )
            })}
            {sortedAds.length === 0 && (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center text-sm text-gray-400">
                  No analytics data available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Location Engagement */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-primary mb-4">Location Engagement</h3>
        <div className="grid grid-cols-3 gap-6">
          {sortedAds.map(ad => {
            const p = ad.periodTotals
            const notifRate = p.geofenceEntries > 0
              ? ((p.notificationOpens / p.geofenceEntries) * 100).toFixed(1)
              : '0.0'
            const dirRate = p.notificationOpens > 0
              ? ((p.directionRequests / p.notificationOpens) * 100).toFixed(1)
              : '0.0'
            const overallConv = p.geofenceEntries > 0
              ? (p.directionRequests / p.geofenceEntries) * 100
              : 0
            const indicator = overallConv >= 20
              ? 'bg-emerald-500'
              : overallConv >= 10
              ? 'bg-amber-400'
              : 'bg-red-400'
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
                    <span className="text-sm font-bold text-primary">{formatNumber(p.geofenceEntries)}</span>
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
