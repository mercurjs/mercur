import { ReactNode, Children } from "react"
import { Container } from "@medusajs/ui"

import { ApiKeyManagementListDataTable } from "./api-key-management-list-data-table"
import { ApiKeyManagementListHeader } from "./api-key-management-list-header"

export { ApiKeyManagementListDataTable } from "./api-key-management-list-data-table"
export {
  ApiKeyManagementListHeader,
  ApiKeyManagementListTitle,
  ApiKeyManagementListActions,
} from "./api-key-management-list-header"

export const ApiKeyManagementListView = ({
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
          <ApiKeyManagementListHeader />
          <ApiKeyManagementListDataTable />
        </>
      )}
    </Container>
  )
}
