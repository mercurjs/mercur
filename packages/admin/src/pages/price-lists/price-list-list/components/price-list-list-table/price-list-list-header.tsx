import { ReactNode } from "react"
import { Button, Heading, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import { hasExplicitCompoundComposition } from "../../../../../lib/compound-composition"

export const PriceListListTitle = () => {
  const { t } = useTranslation()
  return (
    <div>
      <Heading>{t("priceLists.domain")}</Heading>
      <Text className="text-ui-fg-subtle" size="small">
        {t("priceLists.subtitle")}
      </Text>
    </div>
  )
}

const ACTIONS_ALLOWED_TYPES = [] as const

export const PriceListListActions = ({
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
        <Button size="small" variant="secondary" asChild>
          <Link to="create">{t("actions.create")}</Link>
        </Button>
      )}
    </div>
  )
}

const HEADER_ALLOWED_TYPES = [PriceListListTitle, PriceListListActions] as const

export const PriceListListHeader = ({
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
          <PriceListListTitle />
          <PriceListListActions />
        </>
      )}
    </div>
  )
}
