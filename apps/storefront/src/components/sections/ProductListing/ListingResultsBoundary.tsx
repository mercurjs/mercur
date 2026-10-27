"use client"

import { useSearchParams } from "next/navigation"
import { ReactNode, Suspense } from "react"

// Keyed by the search string so a filter, sort or page change shows the results
// fallback while the toolbar and sidebar stay mounted.
export function ListingResultsBoundary({
  children,
  fallback,
}: {
  children: ReactNode
  fallback: ReactNode
}) {
  const searchParams = useSearchParams()

  return (
    <Suspense key={searchParams.toString()} fallback={fallback}>
      {children}
    </Suspense>
  )
}
