"use client"

import {
  createContext,
  type ReactNode,
  use,
  useLayoutEffect,
  useState,
  useSyncExternalStore,
} from "react"

import type { ListingFacets } from "@/lib/data/search"

type Publication = { facets: ListingFacets; count: number } | null

const createStore = () => {
  let publication: Publication = null
  const listeners = new Set<() => void>()
  return {
    get: () => publication,
    publish: (next: Publication) => {
      publication = next
      for (const listener of listeners) listener()
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}

type Store = ReturnType<typeof createStore>

const ListingFacetsContext = createContext<Store | null>(null)

// The listing owns the store so the sidebar and toolbar stay mounted and keep
// the last results' facets while the next view streams in.
export const ListingFacetsProvider = ({ children }: { children: ReactNode }) => {
  const [store] = useState(createStore)
  return (
    <ListingFacetsContext.Provider value={store}>
      {children}
    </ListingFacetsContext.Provider>
  )
}

export const ListingFacetsPublisher = ({
  facets,
  count,
}: {
  facets: ListingFacets
  count: number
}) => {
  const store = use(ListingFacetsContext)
  useLayoutEffect(() => {
    store?.publish({ facets, count })
  }, [store, facets, count])
  return null
}

const subscribeToNothing = () => () => {}

export const usePublishedListing = (): Publication => {
  const store = use(ListingFacetsContext)
  return useSyncExternalStore(
    store?.subscribe ?? subscribeToNothing,
    () => store?.get() ?? null,
    () => null
  )
}
