const STORAGE_PREFIX = 'codeguardian.'

export function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${key}`)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function writeStorage<T>(key: string, value: T): void {
  window.localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value))
}

export function removeStorage(key: string): void {
  window.localStorage.removeItem(`${STORAGE_PREFIX}${key}`)
}
