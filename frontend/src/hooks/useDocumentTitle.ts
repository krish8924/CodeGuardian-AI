import { useEffect } from 'react'

export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = title ? `${title} · CodeGuardian AI` : 'CodeGuardian AI'
  }, [title])
}
