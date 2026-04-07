export function validateEmail(email) {
  if (!email) return 'Email is required'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Invalid email format'
  return null
}

export function validateRequired(value, fieldName) {
  if (!value || !String(value).trim()) return `${fieldName} is required`
  return null
}

export function validateMinLength(value, min, fieldName) {
  if (!value || String(value).length < min) return `${fieldName} must be at least ${min} characters`
  return null
}
