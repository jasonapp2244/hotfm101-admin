// Converts Firestore Timestamps, ISO strings, or Date objects to a JS Date
function toDate(value) {
  if (!value) return null
  if (value instanceof Date) return value
  // Firestore Timestamp object
  if (typeof value === 'object' && typeof value.toDate === 'function') return value.toDate()
  return new Date(value)
}

export function formatDate(dateStr) {
  const d = toDate(dateStr)
  if (!d || isNaN(d)) return ''
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
}

export function formatTime(dateStr) {
  const d = toDate(dateStr)
  if (!d || isNaN(d)) return ''
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

export function formatRelativeTime(dateStr) {
  const d = toDate(dateStr)
  if (!d || isNaN(d)) return ''
  const now = new Date()
  const diffMs = now - d
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} mins ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Yesterday'
  return `${days} days ago`
}

let counter = 100
export function generateId(prefix = 'id') {
  counter++
  return `${prefix}-${Date.now()}-${counter}`
}

export function getInitials(name) {
  if (!name) return '??'
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export function formatNumber(n) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
  return String(n)
}
