import { useCallback, useEffect, useState } from 'react'

const FALLBACK_MESSAGE = 'The service is unavailable right now. Please try again in a moment.'

// Errors carry the plain-language `detail` of the problem+json body, never a status code.
export async function getJson(path) {
  let response
  try {
    response = await fetch(path, { headers: { Accept: 'application/json' } })
  } catch {
    throw new Error(FALLBACK_MESSAGE)
  }
  const body = await response.json().catch(() => null)
  if (!response.ok || body === null) {
    throw new Error(body?.detail ?? FALLBACK_MESSAGE)
  }
  return body
}

// Loads `path` (or calls `loader`), optionally refreshing every `refreshMs` while the tab is visible.
export function useApi(path, { loader, refreshMs } = {}) {
  const [state, setState] = useState({ status: 'loading', data: null, error: null })
  const [attempt, setAttempt] = useState(0)
  const reload = useCallback(() => setAttempt((value) => value + 1), [])

  useEffect(() => {
    let cancelled = false
    const load = (initial) => {
      if (initial) setState((current) => ({ ...current, status: 'loading', error: null }))
      Promise.resolve(loader ? loader() : getJson(path))
        .then((data) => !cancelled && setState({ status: 'ready', data, error: null }))
        .catch((error) => {
          if (cancelled) return
          // A failed background refresh keeps the last good data on screen.
          setState((current) => (initial || !current.data
            ? { status: 'error', data: null, error: error.message }
            : { ...current, error: error.message }))
        })
    }

    load(true)
    if (!refreshMs) return () => {
      cancelled = true
    }
    const timer = setInterval(() => document.visibilityState === 'visible' && load(false), refreshMs)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [path, loader, refreshMs, attempt])

  return { ...state, reload }
}
