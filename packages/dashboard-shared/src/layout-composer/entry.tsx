import { Fragment, type ReactNode } from "react"

export type LayoutEntryProps = {
  /** Stable identity for this entry; survives component renames and minification. */
  id: string
  children: ReactNode
}

export function LayoutEntry({ children }: LayoutEntryProps) {
  return <Fragment>{children}</Fragment>
}

LayoutEntry.displayName = "LayoutEntry"
