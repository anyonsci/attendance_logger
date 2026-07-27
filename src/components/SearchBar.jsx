import Fuse from 'fuse.js'
import { useMemo, useState } from 'react'

export function SearchBar({
  value,
  onChange,
  placeholder = 'Search people...',
}) {
  return (
    <div style={{ position: 'relative', marginBottom: '1rem' }}>
      <svg
        style={{
          position: 'absolute',
          left: '0.9rem',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '1.1rem',
          height: '1.1rem',
          color: '#94a3b8',
          pointerEvents: 'none',
        }}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: '0.65rem 2.5rem 0.65rem 2.6rem',
          borderRadius: '999px',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          background: 'rgba(30, 41, 59, 0.8)',
          color: '#f8fafc',
          fontSize: '0.95rem',
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          title="Clear search"
          aria-label="Clear search"
          style={{
            position: 'absolute',
            right: '0.5rem',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '1.75rem',
            height: '1.75rem',
            padding: 0,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.1)',
            color: '#94a3b8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            border: 'none',
          }}
        >
          ✕
        </button>
      )}
    </div>
  )
}

/**
 * Custom hook to fuzzy search a list of items using fuse.js
 */
export function useFuzzySearch(items, keys, searchTerm, options = {}) {
  const fuse = useMemo(() => {
    return new Fuse(items, {
      keys,
      threshold: 0.4, // Max distance threshold for ~1 character mistype tolerance
      ignoreLocation: true,
      minMatchCharLength: 1,
      ...options,
    })
  }, [items, keys, options])

  return useMemo(() => {
    const trimmed = searchTerm?.trim()
    if (!trimmed) return items
    return fuse.search(trimmed).map((result) => result.item)
  }, [fuse, items, searchTerm])
}
