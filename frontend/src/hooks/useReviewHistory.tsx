import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { ReviewRecord } from '@/types/api'
import { readStorage, writeStorage } from '@/utils/storage'

const STORAGE_KEY = 'reviews.v1'
const MAX_STORED_REVIEWS = 50

function isReviewRecord(value: unknown): value is ReviewRecord {
  if (!value || typeof value !== 'object') return false

  const record = value as Partial<ReviewRecord>

  return (
    record.version === 1 &&
    typeof record.id === 'string' &&
    typeof record.owner === 'string' &&
    typeof record.repo === 'string' &&
    typeof record.prNumber === 'number' &&
    typeof record.analyzedAt === 'string' &&
    typeof record.totalFindings === 'number' &&
    Array.isArray(record.findings) &&
    Array.isArray(record.files) &&
    Boolean(record.pullRequest)
  )
}

function loadStoredReviews(): ReviewRecord[] {
  const stored = readStorage<unknown>(STORAGE_KEY, [])

  if (!Array.isArray(stored)) return []

  return stored
    .filter(isReviewRecord)
    .sort((a, b) => new Date(b.analyzedAt).getTime() - new Date(a.analyzedAt).getTime())
    .slice(0, MAX_STORED_REVIEWS)
}

interface ReviewHistoryValue {
  reviews: ReviewRecord[]
  storageError: string | null
  addReview: (review: ReviewRecord) => void
  removeReview: (id: string) => void
  clearReviews: () => void
  getReview: (id: string) => ReviewRecord | undefined
}

const ReviewHistoryContext = createContext<ReviewHistoryValue | null>(null)

export function ReviewHistoryProvider({ children }: { children: ReactNode }) {
  const [reviews, setReviews] = useState<ReviewRecord[]>(loadStoredReviews)
  const [storageError, setStorageError] = useState<string | null>(null)

  useEffect(() => {
    try {
      writeStorage(STORAGE_KEY, reviews)
      setStorageError(null)
    } catch {
      setStorageError(
        'This browser could not save the review history (local storage may be full or blocked). The current session still works.',
      )
    }
  }, [reviews])

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (event.key !== `codeguardian.${STORAGE_KEY}`) return
      setReviews(loadStoredReviews())
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const addReview = useCallback((review: ReviewRecord) => {
    setReviews((current) => {
      const withoutExisting = current.filter((item) => item.id !== review.id)
      return [review, ...withoutExisting]
        .sort(
          (a, b) => new Date(b.analyzedAt).getTime() - new Date(a.analyzedAt).getTime(),
        )
        .slice(0, MAX_STORED_REVIEWS)
    })
  }, [])

  const removeReview = useCallback((id: string) => {
    setReviews((current) => current.filter((review) => review.id !== id))
  }, [])

  const clearReviews = useCallback(() => {
    setReviews([])
  }, [])

  const getReview = useCallback(
    (id: string) => reviews.find((review) => review.id === id),
    [reviews],
  )

  const value = useMemo<ReviewHistoryValue>(
    () => ({
      reviews,
      storageError,
      addReview,
      removeReview,
      clearReviews,
      getReview,
    }),
    [addReview, clearReviews, getReview, reviews, storageError, removeReview],
  )

  return (
    <ReviewHistoryContext.Provider value={value}>{children}</ReviewHistoryContext.Provider>
  )
}

export function useReviewHistory(): ReviewHistoryValue {
  const context = useContext(ReviewHistoryContext)
  if (!context) {
    throw new Error('useReviewHistory must be used inside ReviewHistoryProvider')
  }
  return context
}
