import { createContext } from "react"

type CategoryMediaViewContextValue = {
  goToGallery: () => void
  goToEdit: () => void
}

export const CategoryMediaViewContext =
  createContext<CategoryMediaViewContextValue | null>(null)
