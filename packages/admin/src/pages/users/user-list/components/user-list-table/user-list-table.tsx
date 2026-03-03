import { Children, ReactNode } from "react"
import { Container } from "@medusajs/ui"

import { UserListHeader } from "./user-list-header"
import { UserListDataTable } from "./user-list-data-table"

export { UserListDataTable } from "./user-list-data-table"
export {
  UserListHeader,
  UserListTitle,
  UserListActions,
} from "./user-list-header"

export const UserListTable = ({ children }: { children?: ReactNode }) => {
  return (
    <Container className="divide-y p-0">
      {Children.count(children) > 0 ? (
        children
      ) : (
        <>
          <UserListHeader />
          <UserListDataTable />
        </>
      )}
    </Container>
  )
}
