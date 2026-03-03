import { ReactNode } from "react"
import { Button, Heading, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import { hasExplicitCompoundComposition } from "../../../../../lib/compound-composition"

export const CategoryListTitle = () => {
  const { t } = useTranslation()
  return (
    <div>
      <Heading>{t("categories.domain")}</Heading>
      <Text className="text-ui-fg-subtle" size="small">
        {t("categories.subtitle")}
      </Text>
    </div>
  )
}

const ACTIONS_ALLOWED_TYPES = [] as const

export const CategoryListActions = ({
  children,
}: {
  children?: ReactNode
}) => {
  const { t } = useTranslation()
  return (
    <div className="flex items-center gap-x-2">
      {hasExplicitCompoundComposition(children, ACTIONS_ALLOWED_TYPES) ? (
        children
      ) : (
        <>
          <Button size="small" variant="secondary" asChild>
            <Link to="organize">{t("categories.organize.action")}</Link>
          </Button>
          <Button size="small" variant="secondary" asChild>
            <Link to="create">{t("actions.create")}</Link>
          </Button>
        </>
      )}
    </div>
  )
}

const HEADER_ALLOWED_TYPES = [CategoryListTitle, CategoryListActions] as const

export const CategoryListHeader = ({
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
          <CategoryListTitle />
          <CategoryListActions />
        </>
      )}
    </div>
  )
}
