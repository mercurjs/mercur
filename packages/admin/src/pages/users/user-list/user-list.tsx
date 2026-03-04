import { ReactNode, Children } from "react"

import { SingleColumnPage } from "../../../components/layout/pages"
import {
  UserListTable,
  UserListDataTable,
  UserListHeader,
  UserListActions,
  UserListTitle,
} from "./components/user-list-table"

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage>
      {Children.count(children) > 0 ? children : <UserListTable />}
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

