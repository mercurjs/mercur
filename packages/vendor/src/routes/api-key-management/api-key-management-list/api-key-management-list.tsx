import { useLocation } from "react-router-dom"
import { getApiKeyTypeFromPathname } from "../common/utils"
import { ApiKeyManagementListTable } from "./components/api-key-management-list-table"

import { SingleColumnPage } from "../../../components/layout/pages"


export const ApiKeyManagementList = () => {
  const { pathname } = useLocation()

  const keyType = getApiKeyTypeFromPathname(pathname)

  return (
    <SingleColumnPage
      hasOutlet
    >
      <ApiKeyManagementListTable keyType={keyType} />
    </SingleColumnPage>
  )
}
