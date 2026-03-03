import { Children, ReactNode } from "react"
import { useLocation } from "react-router-dom"

import { SingleColumnPage } from "../../../components/layout/pages"
import { getApiKeyTypeFromPathname } from "../common/utils"
import { ApiKeyManagementListTable } from "./components/api-key-management-list-table"

const Root = ({ children }: { children?: ReactNode }) => {
  const { pathname } = useLocation()
  const keyType = getApiKeyTypeFromPathname(pathname)

  return (
    <SingleColumnPage hasOutlet data-testid="publishable-api-keys-list-page">
      {Children.count(children) > 0 ? (
        children
      ) : (
        <ApiKeyManagementListTable keyType={keyType} />
      )}
    </SingleColumnPage>
  )
}

export const ApiKeyManagementList = Object.assign(Root, {
  Table: ApiKeyManagementListTable,
})
