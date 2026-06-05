import { createContext } from "react"

type VariantMediaViewContextValue = {
  goToGallery: () => void
  goToEdit: () => void
  onSubmit?: () => void
  onCancel?: () => void
  onClose?: () => void
}

export const VariantMediaViewContext =
  createContext<VariantMediaViewContextValue | null>(null)
