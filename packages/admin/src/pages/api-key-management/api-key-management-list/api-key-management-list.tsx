import { ReactNode, Children } from "react"

import { SingleColumnPage } from "../../../components/layout/pages"
import {
  ApiKeyManagementListView,
  ApiKeyManagementListDataTable,
  ApiKeyManagementListHeader,
  ApiKeyManagementListActions,
  ApiKeyManagementListTitle,
} from "./components/api-key-management-list-view"

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage
      hasOutlet
      data-testid="publishable-api-keys-list-page"
    >
      {Children.count(children) > 0 ? children : <ApiKeyManagementListView />}
    </SingleColumnPage>
  )
}

export const ApiKeyManagementListPage = Object.assign(Root, {
  Table: ApiKeyManagementListView,
  Header: ApiKeyManagementListHeader,
  HeaderTitle: ApiKeyManagementListTitle,
  HeaderActions: ApiKeyManagementListActions,
  DataTable: ApiKeyManagementListDataTable,
})
