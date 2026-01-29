import { PropsWithChildren } from "react"
import { DashboardApp } from "../../dashboard-app/dashboard-app"
import { ExtensionContext } from "./extension-context"

type ExtensionProviderProps = PropsWithChildren<{
  api: DashboardApp["api"]
}>

export const ExtensionProvider = ({
  api,
  children,
}: ExtensionProviderProps) => {
  return (
    <ExtensionContext.Provider value={api}>
      {children}
    </ExtensionContext.Provider>
  )
}
