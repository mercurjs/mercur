import { useCallback, useEffect, useRef, useState } from "react"

/**
 * Hook for debouncing search input
 * @returns searchValue, onSearchValueChange, query
 */
export const useDebouncedSearch = () => {
  const [searchValue, onSearchValueChange] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  const debouncedUpdate = useCallback((query: string) => {
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setDebouncedQuery(query), 300)
  }, [])

  useEffect(() => {
    debouncedUpdate(searchValue)

    return () => clearTimeout(timerRef.current)
  }, [searchValue, debouncedUpdate])

  return {
    searchValue,
    onSearchValueChange,
    query: debouncedQuery || undefined,
  }
}
