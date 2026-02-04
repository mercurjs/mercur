import { useLocation } from "react-router-dom"

import { SingleColumnPage } from "@components/layout/pages"
import { useExtension } from "@providers/extension-provider"

import { getApiKeyTypeFromPathname } from "./_common/utils"
import { ApiKeyManagementListTable } from "./_components/api-key-management-list-table"

export const nav = {
  id: "api-keys",
  labelKey: "navigation.items.apiKeys",
  iconKey: "bolt",
  section: "settings",
  order: 40,
}

const ApiKeyManagementList = () => {
  const { pathname } = useLocation()
  const { getWidgets } = useExtension()

  const keyType = getApiKeyTypeFromPathname(pathname)

  return (
    <SingleColumnPage
      hasOutlet
      widgets={{
        before: getWidgets("api_key.list.before"),
        after: getWidgets("api_key.list.after"),
      }}
      data-testid="publishable-api-keys-list-page"
    >
      <ApiKeyManagementListTable keyType={keyType} />
    </SingleColumnPage>
  )
}

export const Component = ApiKeyManagementList
