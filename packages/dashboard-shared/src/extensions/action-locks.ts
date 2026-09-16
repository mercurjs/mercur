import { useCallback, useMemo } from "react"
import { useExtension } from "./context"

/** Returns a lookup for the lock reason plugins declare on an entity's action. */
export const useActionLocks = (model: string, entity: unknown) => {
  const registry = useExtension()
  return useCallback(
    (action: string) => registry.getActionLock(model, action, entity),
    [registry, model, entity]
  )
}

/** Timeline entries plugins contribute for an entity. */
export const useExtensionActivity = (model: string, entity: unknown) => {
  const registry = useExtension()
  return useMemo(
    () => registry.getActivity(model, entity),
    [registry, model, entity]
  )
}
