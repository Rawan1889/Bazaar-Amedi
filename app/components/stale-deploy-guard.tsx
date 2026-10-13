'use client'

// Every deploy renames the server actions. A page opened before the deploy
// keeps calling the old names, the server answers "action not found", and the
// save fails (this is what broke adding/editing delivery zones). Reloading
// picks up the new build, so the next tap works.

import { useEffect } from 'react'
import { unstable_isUnrecognizedActionError } from 'next/navigation'

const RELOAD_KEY = 'kela-stale-deploy-reload'

export function isStaleDeployError(error: unknown): boolean {
  return unstable_isUnrecognizedActionError(error)
}

// Reloads the page once for a stale-deploy error. Returns true when a reload
// was started. Won't reload twice within 10s, so a persistent error can't loop.
export function reloadIfStaleDeploy(error: unknown): boolean {
  if (!isStaleDeployError(error)) return false
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) || 0)
    if (Date.now() - last < 10_000) return false
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()))
  } catch {
    // Storage blocked (private mode) — still reload; the error is rare enough.
  }
  window.location.reload()
  return true
}

// Catches action calls that aren't inside an error boundary's reach
// (e.g. `await someAction()` in an onClick with no try/catch).
export function StaleDeployGuard() {
  useEffect(() => {
    const onRejection = (e: PromiseRejectionEvent) => {
      if (reloadIfStaleDeploy(e.reason)) e.preventDefault()
    }
    const onError = (e: ErrorEvent) => {
      if (reloadIfStaleDeploy(e.error)) e.preventDefault()
    }
    window.addEventListener('unhandledrejection', onRejection)
    window.addEventListener('error', onError)
    return () => {
      window.removeEventListener('unhandledrejection', onRejection)
      window.removeEventListener('error', onError)
    }
  }, [])

  return null
}
