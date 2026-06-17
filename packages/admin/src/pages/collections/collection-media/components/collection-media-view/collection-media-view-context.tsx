import { createContext } from "react"

type CollectionMediaViewContextValue = {
  goToGallery: () => void
  goToEdit: () => void
}

export const CollectionMediaViewContext =
  createContext<CollectionMediaViewContextValue | null>(null)
