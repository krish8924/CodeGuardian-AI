import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { api } from '@/services/api'
import type { GitHubConnectionResponse, HealthResponse } from '@/types/api'
import { getErrorMessage } from '@/utils/format'

export type ConnectionState = 'checking' | 'online' | 'offline'

interface BackendStatusValue {
  health: ConnectionState
  healthData: HealthResponse | null
  healthError: string | null
  github: ConnectionState
  githubData: GitHubConnectionResponse | null
  githubError: string | null
  lastChecked: Date | null
  refresh: () => Promise<void>
}

const BackendStatusContext = createContext<BackendStatusValue | null>(null)

const POLL_INTERVAL_MS = 30_000

export function BackendStatusProvider({ children }: { children: ReactNode }) {
  const [health, setHealth] = useState<ConnectionState>('checking')
  const [healthData, setHealthData] = useState<HealthResponse | null>(null)
  const [healthError, setHealthError] = useState<string | null>(null)
  const [github, setGithub] = useState<ConnectionState>('checking')
  const [githubData, setGithubData] = useState<GitHubConnectionResponse | null>(null)
  const [githubError, setGithubError] = useState<string | null>(null)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const checkHealth = useCallback(async (showChecking = true) => {
    if (showChecking) setHealth('checking')

    try {
      const data = await api.health()
      if (!mounted.current) return
      setHealthData(data)
      setHealthError(
        data.status.toLowerCase() === 'healthy' ? null : `Backend reported "${data.status}".`,
      )
      setHealth('online')
    } catch (error) {
      if (!mounted.current) return
      setHealth('offline')
      setHealthData(null)
      setHealthError(getErrorMessage(error))
    } finally {
      if (mounted.current) setLastChecked(new Date())
    }
  }, [])

  const checkGithub = useCallback(async () => {
    setGithub('checking')

    try {
      const data = await api.githubTest()
      if (!mounted.current) return
      setGithubData(data)
      setGithubError(null)
      setGithub('online')
    } catch (error) {
      if (!mounted.current) return
      setGithub('offline')
      setGithubData(null)
      setGithubError(getErrorMessage(error))
    }
  }, [])

  const refresh = useCallback(async () => {
    await Promise.allSettled([checkHealth(), checkGithub()])
  }, [checkGithub, checkHealth])

  useEffect(() => {
    void refresh()

    const interval = window.setInterval(() => {
      void checkHealth(false)
    }, POLL_INTERVAL_MS)

    return () => window.clearInterval(interval)
  }, [checkHealth, refresh])

  const value = useMemo<BackendStatusValue>(
    () => ({
      health,
      healthData,
      healthError,
      github,
      githubData,
      githubError,
      lastChecked,
      refresh,
    }),
    [
      github,
      githubData,
      githubError,
      health,
      healthData,
      healthError,
      lastChecked,
      refresh,
    ],
  )

  return (
    <BackendStatusContext.Provider value={value}>{children}</BackendStatusContext.Provider>
  )
}

export function useBackendStatus(): BackendStatusValue {
  const context = useContext(BackendStatusContext)
  if (!context) {
    throw new Error('useBackendStatus must be used inside BackendStatusProvider')
  }
  return context
}
