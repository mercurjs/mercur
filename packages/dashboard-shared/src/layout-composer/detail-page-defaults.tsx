import type { ReactNode } from "react"
import { JsonViewSection } from "../components/common/json-view-section"
import { MetadataSection } from "../components/common/metadata-section"
import { LayoutEntry } from "./entry"

export type DetailPageDefaultsOptions = {
  metadata?: boolean
  jsonView?: boolean
}

/**
 * The sections every detail page ends with, each a stable entry so a
 * preference can hide or move them.
 */
export function detailPageDefaultEntries(
  data: object,
  { metadata = true, jsonView = true }: DetailPageDefaultsOptions = {}
): ReactNode {
  return (
    <>
      {metadata && (
        <LayoutEntry id="MetadataSection">
          <MetadataSection data={data} />
        </LayoutEntry>
      )}
      {jsonView && (
        <LayoutEntry id="JsonViewSection">
          <JsonViewSection data={data} />
        </LayoutEntry>
      )}
    </>
  )
}
