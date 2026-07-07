import { ReactNode, Children } from "react"

import { WidgetZone } from "@mercurjs/dashboard-shared"

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
      <WidgetZone id="users.list">
        {Children.count(children) > 0 ? children : <UserListTable />}
      </WidgetZone>
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

