import { useState, useMemo } from 'react'

export default function useSearch(items, searchFields) {
  const [query, setQuery] = useState('')

  const filteredItems = useMemo(() => {
    if (!query.trim()) return items
    const lower = query.toLowerCase()
    return items.filter(item =>
      searchFields.some(field => {
        const val = item[field]
        return val && String(val).toLowerCase().includes(lower)
      })
    )
  }, [items, query, searchFields])

  return { query, setQuery, filteredItems }
}
