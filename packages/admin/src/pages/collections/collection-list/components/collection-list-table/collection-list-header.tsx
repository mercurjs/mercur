import { ReactNode } from "react"
import { Button, Heading, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import { hasExplicitCompoundComposition } from "../../../../../lib/compound-composition"

export const CollectionListTitle = () => {
  const { t } = useTranslation()
  return (
    <div>
      <Heading>{t("collections.domain")}</Heading>
      <Text className="text-ui-fg-subtle" size="small">
        {t("collections.subtitle")}
      </Text>
    </div>
  )
}

const ACTIONS_ALLOWED_TYPES = [] as const

export const CollectionListActions = ({
  children,
}: {
  children?: ReactNode
}) => {
  const { t } = useTranslation()
  return (
    <div className="flex items-center justify-center gap-x-2">
      {hasExplicitCompoundComposition(children, ACTIONS_ALLOWED_TYPES) ? (
        children
      ) : (
        <Link to="/collections/create">
          <Button size="small" variant="secondary">
            {t("actions.create")}
          </Button>
        </Link>
      )}
    </div>
  )
}

const HEADER_ALLOWED_TYPES = [CollectionListTitle, CollectionListActions] as const

export const CollectionListHeader = ({
  children,
}: {
  children?: ReactNode
}) => {
  return (
    <div className="flex items-center justify-between px-6 py-4">
      {hasExplicitCompoundComposition(children, HEADER_ALLOWED_TYPES) ? (
        children
      ) : (
        <>
          <CollectionListTitle />
          <CollectionListActions />
        </>
      )}
    </div>
  )
}
