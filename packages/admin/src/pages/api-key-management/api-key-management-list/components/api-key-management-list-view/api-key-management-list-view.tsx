import { ReactNode } from "react"
import { Container } from "@medusajs/ui"

import { hasExplicitCompoundComposition } from "../../../../../lib/compound-composition"
import { ApiKeyManagementListDataTable } from "./api-key-management-list-data-table"
import { ApiKeyManagementListHeader } from "./api-key-management-list-header"

export { ApiKeyManagementListDataTable } from "./api-key-management-list-data-table"
export {
  ApiKeyManagementListHeader,
  ApiKeyManagementListTitle,
  ApiKeyManagementListActions,
} from "./api-key-management-list-header"

const TABLE_ALLOWED_TYPES = [
  ApiKeyManagementListHeader,
  ApiKeyManagementListDataTable,
] as const

export const ApiKeyManagementListView = ({
  children,
}: {
  children?: ReactNode
}) => {
  return (
    <Container className="divide-y p-0">
      {hasExplicitCompoundComposition(children, TABLE_ALLOWED_TYPES) ? (
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
