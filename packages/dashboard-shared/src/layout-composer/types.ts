import type { ReactNode } from "react"
import type {
  LayoutComponentProps,
  LayoutConfig,
  Layouts,
  SectionNameFor,
} from "@mercurjs/dashboard-sdk"

export type { LayoutComponentProps, LayoutConfig, Layouts, SectionNameFor }

export type EntryRenderer = (data: unknown) => ReactNode

export type RawEntry = {
  entryId: string
  render: EntryRenderer
  naturalSection: string
  order?: number
  /** Entry id this one takes the place of. */
  replace?: string
}

export type DisplayEntry = {
  entryId: string
  render: EntryRenderer
  order: number
  hidden: boolean
}
