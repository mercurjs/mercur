import { Children, ReactNode } from "react"
import { Button, Heading, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { Link, useLocation } from "react-router-dom"
import { getApiKeyTypeFromPathname } from "../../../common/utils"

export const ApiKeyManagementListTitle = () => {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const keyType = getApiKeyTypeFromPathname(pathname)

  return (
    <div>
      <Heading level="h2" data-testid={`${keyType}-api-keys-heading`}>
        {keyType === "publishable"
          ? t(`apiKeyManagement.domain.publishable`)
          : t("apiKeyManagement.domain.secret")}
      </Heading>
      <Text
        className="text-ui-fg-subtle"
        size="small"
        data-testid={`${keyType}-api-keys-description`}
      >
        {keyType === "publishable"
          ? t(`apiKeyManagement.subtitle.publishable`)
          : t("apiKeyManagement.subtitle.secret")}
      </Text>
    </div>
  )
}

export const ApiKeyManagementListActions = ({
  children,
}: {
  children?: ReactNode
}) => {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const keyType = getApiKeyTypeFromPathname(pathname)

  return (
    <div className="flex items-center justify-center gap-x-2">
      {Children.count(children) > 0 ? (
        children
      ) : (
        <Link to="create" data-testid={`${keyType}-api-keys-create-button`}>
          <Button variant="secondary" size="small">
            {t("actions.create")}
          </Button>
        </Link>
      )}
    </div>
  )
}

export const ApiKeyManagementListHeader = ({
  children,
}: {
  children?: ReactNode
}) => {
  const { pathname } = useLocation()
  const keyType = getApiKeyTypeFromPathname(pathname)

  return (
    <div
      className="flex items-center justify-between px-6 py-4"
      data-testid={`${keyType}-api-keys-header`}
    >
      {Children.count(children) > 0 ? (
        children
      ) : (
        <>
          <ApiKeyManagementListTitle />
          <ApiKeyManagementListActions />
        </>
      )}
    </div>
  )
}
