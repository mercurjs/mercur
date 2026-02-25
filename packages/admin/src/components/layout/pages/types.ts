import { ReactNode } from "react"

export interface PageProps<TData> {
  children: ReactNode
  data?: TData
  showJSON?: boolean
  showMetadata?: boolean
  hasOutlet?: boolean
}
