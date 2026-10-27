"use client"

import { useParams } from "next/navigation"
import { ReactNode, Suspense } from "react"

// useParams() suspends while a route below has unknown params, so the nav renders
// its fallback (nothing highlighted) in the static shell and highlights on load.
export function ActiveCategory({
  children,
  fallback,
}: {
  children: (category?: string) => ReactNode
  fallback: ReactNode
}) {
  return (
    <Suspense fallback={fallback}>
      <ResolvedCategory render={children} />
    </Suspense>
  )
}

function ResolvedCategory({ render }: { render: (category?: string) => ReactNode }) {
  const { category } = useParams<{ category?: string }>()
  return render(category)
}
