import { useContext } from "react"
import { ExtensionContext } from "./extension-context"

export const useExtension = () => {
  const context = useContext(ExtensionContext)
  if (!context) {
    throw new Error("useExtension must be used within a ExtensionProvider")
  }
  return context
}
