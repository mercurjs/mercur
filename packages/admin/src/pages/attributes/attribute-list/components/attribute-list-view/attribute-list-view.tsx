import { ReactNode, Children } from "react"
import { Container } from "@medusajs/ui"

import { AttributeListDataTable } from "./attribute-list-data-table"
import { AttributeListHeader } from "./attribute-list-header"

export { AttributeListDataTable } from "./attribute-list-data-table"
export {
  AttributeListHeader,
  AttributeListTitle,
  AttributeListActions,
} from "./attribute-list-header"

export const AttributeListView = ({
  children,
}: {
  children?: ReactNode
}) => {
  return (
    <Container className="divide-y p-0">
      {Children.count(children) > 0 ? (
        children
      ) : (
        <>
          <AttributeListHeader />
          <AttributeListDataTable />
        </>
      )}
    </Container>
  )
}
