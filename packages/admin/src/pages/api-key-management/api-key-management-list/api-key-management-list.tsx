import { ReactNode } from "react"

import { SingleColumnPage } from "../../../components/layout/pages"
import { hasExplicitCompoundComposition } from "../../../lib/compound-composition"
import {
  ApiKeyManagementListView,
  ApiKeyManagementListDataTable,
  ApiKeyManagementListHeader,
  ApiKeyManagementListActions,
  ApiKeyManagementListTitle,
} from "./components/api-key-management-list-view"

const ALLOWED_TYPES = [ApiKeyManagementListView] as const

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage
      hasOutlet
      data-testid="publishable-api-keys-list-page"
    >
      {hasExplicitCompoundComposition(children, ALLOWED_TYPES) ? children : <ApiKeyManagementListView />}
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
