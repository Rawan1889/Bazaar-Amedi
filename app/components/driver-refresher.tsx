'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Polls every 30 seconds so the driver sees new orders without manual refresh.
export function DriverRefresher() {
  const router = useRouter()

  useEffect(() => {
    const id = setInterval(() => router.refresh(), 30_000)
    return () => clearInterval(id)
  }, [router])

  return null
}
