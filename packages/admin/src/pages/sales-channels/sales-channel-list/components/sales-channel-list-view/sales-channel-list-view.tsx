import { ReactNode, Children } from "react"
import { Container } from "@medusajs/ui"

import { SalesChannelListDataTable } from "./sales-channel-list-data-table"
import { SalesChannelListHeader } from "./sales-channel-list-header"

export { SalesChannelListDataTable } from "./sales-channel-list-data-table"
export {
  SalesChannelListHeader,
  SalesChannelListTitle,
  SalesChannelListActions,
} from "./sales-channel-list-header"

export const SalesChannelListView = ({
  children,
}: {
  children?: ReactNode
}) => {
  return (
    <Container className="divide-y p-0" data-testid="sales-channel-list-table-container">
      {Children.count(children) > 0 ? (
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
