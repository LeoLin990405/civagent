import { useState, useEffect, useCallback, useRef } from "react"
import type { SystemStatus } from "../types"

const DEFAULT_REFRESH_INTERVAL = 30000

function getAuthToken(): string {
  return localStorage.getItem('boluo_auth_token') || ''
}

function getRefreshInterval(): number {
  try {
    const raw = localStorage.getItem('boluo_settings')
    if (raw) {
      const settings = JSON.parse(raw)
      if (typeof settings.refreshInterval === 'number' && settings.refreshInterval >= 5000) {
        return settings.refreshInterval
      }
    }
  } catch {}
  return DEFAULT_REFRESH_INTERVAL
}

export function useStatus() {
  const [data, setData] = useState<SystemStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  // [L-09] AbortController 防止组件卸载后更新状态
  const abortRef = useRef<AbortController | null>(null)

  const fetchStatus = useCallback(async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    try {
      const res = await fetch("/api/status", {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        },
        signal: controller.signal
      })
      if (res.status === 401) {
        // Token invalid/expired — clear and redirect to login
        localStorage.removeItem('boluo_auth_token')
        window.location.reload()
        return
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      const json = await res.json()
      if (!controller.signal.aborted) {
        setData(json)
        setError(null)
        setLastUpdated(new Date())
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      if (!controller.signal.aborted) {
        setError(err instanceof Error ? err.message : "Unknown error")
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, getRefreshInterval())
    return () => {
      clearInterval(interval)
      abortRef.current?.abort()
    }
  }, [fetchStatus])

  return { data, loading, error, lastUpdated, refresh: fetchStatus }
}
