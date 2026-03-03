import { ReactNode } from "react"

import { SingleColumnPage } from "../../../components/layout/pages"
import { hasExplicitCompoundComposition } from "../../../lib/compound-composition"
import {
  CollectionListTable,
  CollectionListDataTable,
  CollectionListHeader,
  CollectionListActions,
  CollectionListTitle,
} from "./components/collection-list-table"

const ALLOWED_TYPES = [CollectionListTable] as const

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage>
      {hasExplicitCompoundComposition(children, ALLOWED_TYPES) ? children : <CollectionListTable />}
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
