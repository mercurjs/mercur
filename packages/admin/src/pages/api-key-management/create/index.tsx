import { useLocation } from "react-router-dom"

import { RouteFocusModal } from "@components/modals"

import { getApiKeyTypeFromPathname } from "../_common/utils"
import { ApiKeyCreateForm } from "./_components/api-key-create-form"

const ApiKeyManagementCreate = () => {
  const { pathname } = useLocation()
  const keyType = getApiKeyTypeFromPathname(pathname)

  return (
    <RouteFocusModal data-testid={`${keyType}-api-key-create-modal`}>
      <ApiKeyCreateForm keyType={keyType} />
    </RouteFocusModal>
  )
}

export const Component = ApiKeyManagementCreate
