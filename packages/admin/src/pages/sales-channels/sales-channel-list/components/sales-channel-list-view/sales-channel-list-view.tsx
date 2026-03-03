import { ReactNode } from "react"
import { Container } from "@medusajs/ui"

import { hasExplicitCompoundComposition } from "../../../../../lib/compound-composition"
import { SalesChannelListDataTable } from "./sales-channel-list-data-table"
import { SalesChannelListHeader } from "./sales-channel-list-header"

export { SalesChannelListDataTable } from "./sales-channel-list-data-table"
export {
  SalesChannelListHeader,
  SalesChannelListTitle,
  SalesChannelListActions,
} from "./sales-channel-list-header"

const TABLE_ALLOWED_TYPES = [
  SalesChannelListHeader,
  SalesChannelListDataTable,
] as const

export const SalesChannelListView = ({
  children,
}: {
  children?: ReactNode
}) => {
  return (
    <Container className="divide-y p-0" data-testid="sales-channel-list-table-container">
      {hasExplicitCompoundComposition(children, TABLE_ALLOWED_TYPES) ? (
        children
      ) : (
        <>
          <SalesChannelListHeader />
          <SalesChannelListDataTable />
        </>
      )}
    </Container>
  )
}
