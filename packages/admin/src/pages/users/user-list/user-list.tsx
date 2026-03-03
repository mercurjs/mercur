import { ReactNode } from "react"

import { SingleColumnPage } from "../../../components/layout/pages"
import { hasExplicitCompoundComposition } from "../../../lib/compound-composition"
import {
  UserListTable,
  UserListDataTable,
  UserListHeader,
  UserListActions,
  UserListTitle,
} from "./components/user-list-table"

const ALLOWED_TYPES = [UserListTable] as const

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage>
      {hasExplicitCompoundComposition(children, ALLOWED_TYPES) ? children : <UserListTable />}
    </SingleColumnPage>
  )
}

export const UserListPage = Object.assign(Root, {
  Table: UserListTable,
  Header: UserListHeader,
  HeaderTitle: UserListTitle,
  HeaderActions: UserListActions,
  DataTable: UserListDataTable,
})

