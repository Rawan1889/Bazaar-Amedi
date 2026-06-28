'use client'

import { useState, useEffect } from 'react'

interface Props {
  date: string | Date
  format?: 'default' | 'time' | 'scheduled' | 'long-date' | 'short-date'
}

export function ClientDate({ date, format = 'default' }: Props) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // Return a hidden placeholder to avoid Layout Shift but prevent hydration mismatch
    return <span style={{ opacity: 0 }} aria-hidden="true">...</span>
  }

  try {
    const d = new Date(date)
    if (isNaN(d.getTime())) return null

    switch (format) {
      case 'time':
        return <span>{d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
      case 'scheduled':
        return <span>{d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
      case 'long-date':
        return <span>{d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
      case 'short-date':
        return <span>{d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
      case 'default':
      default:
        return <span>{d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
    }
  } catch (e) {
    console.error('Error formatting ClientDate:', e)
    return null
  }
}
