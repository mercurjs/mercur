import { createContext, useContext, useMemo, type ReactNode } from "react"
import {
  ExtensionRegistry,
  type CustomFieldsModule,
  type NavigationModule,
  type WidgetModule,
} from "./registry"

const ExtensionContext = createContext<ExtensionRegistry | null>(null)

export type ExtensionProviderProps = {
  widgets?: WidgetModule
  navigation?: NavigationModule
  customFields?: CustomFieldsModule
  children: ReactNode
}

let activeRegistry: ExtensionRegistry | null = null

/**
 * Reads the panel's extension registry outside React (e.g. in a react-router
 * `loader`, which can't call hooks). Returns null until `ExtensionProvider` has
 * mounted; callers should fall back to built-in behavior when null.
 */
export const getExtensionRegistry = (): ExtensionRegistry | null =>
  activeRegistry

export const ExtensionProvider = ({
  widgets,
  navigation,
  customFields,
  children,
}: ExtensionProviderProps) => {
  const registry = useMemo(() => {
    const next = new ExtensionRegistry({ widgets, navigation, customFields })
    activeRegistry = next
    return next
  }, [widgets, navigation, customFields])

  return (
    <ExtensionContext.Provider value={registry}>
      {children}
    </ExtensionContext.Provider>
  )
}

const EMPTY_REGISTRY = new ExtensionRegistry()

/**
 * Reads the panel's extension registry. Returns an empty registry when no
 * provider is mounted so hosts render their built-in content untouched.
 */
export const useExtension = (): ExtensionRegistry => {
  return useContext(ExtensionContext) ?? EMPTY_REGISTRY
}
