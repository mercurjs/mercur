import { ReactNode, Children } from "react"

import { SingleColumnPage } from "../../../components/layout/pages"
import {
  CollectionListTable,
  CollectionListDataTable,
  CollectionListHeader,
  CollectionListActions,
  CollectionListTitle,
} from "./components/collection-list-table"

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage>
      {Children.count(children) > 0 ? children : <CollectionListTable />}
    </SingleColumnPage>
  )
}

export const CollectionList = Object.assign(Root, {
  Table: CollectionListTable,
  Header: CollectionListHeader,
  HeaderTitle: CollectionListTitle,
  HeaderActions: CollectionListActions,
  DataTable: CollectionListDataTable,
})
