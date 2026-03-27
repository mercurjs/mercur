import { ReactNode, Children } from "react"

import { SingleColumnPage } from "../../../components/layout/pages"
import {
  AttributeListView,
  AttributeListDataTable,
  AttributeListHeader,
  AttributeListActions,
  AttributeListTitle,
} from "./components/attribute-list-view"

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage showMetadata={false} showJSON={false} hasOutlet>
      {Children.count(children) > 0 ? children : <AttributeListView />}
    </SingleColumnPage>
  )
}

export const AttributeListPage = Object.assign(Root, {
  Table: AttributeListView,
  Header: AttributeListHeader,
  HeaderTitle: AttributeListTitle,
  HeaderActions: AttributeListActions,
  DataTable: AttributeListDataTable,
})
