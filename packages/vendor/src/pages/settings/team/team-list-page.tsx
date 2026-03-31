import { Children, ReactNode } from "react"

import { SingleColumnPage } from "@components/layout/pages"

import {
  TeamListTable,
  TeamListDataTable,
  TeamListHeader,
  TeamListActions,
  TeamListTitle,
} from "./_components"

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage hasOutlet>
      {Children.count(children) > 0 ? children : <TeamListTable />}
    </SingleColumnPage>
  )
}

export const TeamListPage = Object.assign(Root, {
  Table: TeamListTable,
  Header: TeamListHeader,
  HeaderTitle: TeamListTitle,
  HeaderActions: TeamListActions,
  DataTable: TeamListDataTable,
})
