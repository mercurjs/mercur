import { createContext, useContext, useMemo, type ReactNode } from "react"
import {
  ExtensionRegistry,
  type CustomFieldsModule,
  type LayoutModule,
  type NavigationModule,
  type PreferenceModule,
  type WidgetModule,
} from "./registry"
import { CORE_LAYOUTS } from "../layout-composer/core-layouts"

const ExtensionContext = createContext<ExtensionRegistry | null>(null)

export type ExtensionProviderProps = {
  widgets?: WidgetModule
  navigation?: NavigationModule
  customFields?: CustomFieldsModule
  layouts?: LayoutModule
  preferences?: PreferenceModule
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
  layouts,
  preferences,
  children,
}: ExtensionProviderProps) => {
  const registry = useMemo(() => {
    const next = new ExtensionRegistry({
      widgets,
      navigation,
      customFields,
      layouts,
      preferences,
    })
    next.registerLayouts(CORE_LAYOUTS)
    activeRegistry = next
    return next
  }, [widgets, navigation, customFields, layouts, preferences])

  return (
    <ExtensionContext.Provider value={registry}>
      {children}
    </ExtensionContext.Provider>
  )
}

const EMPTY_REGISTRY = new ExtensionRegistry()
EMPTY_REGISTRY.registerLayouts(CORE_LAYOUTS)

/**
 * Reads the panel's extension registry. Returns an empty registry when no
 * provider is mounted so hosts render their built-in content untouched.
 */
export const useExtension = (): ExtensionRegistry => {
  return useContext(ExtensionContext) ?? EMPTY_REGISTRY
}
