import { Children, ReactNode } from "react"

import { Heading, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

export const OfferConditionListTitle = () => {
  const { t } = useTranslation()
  return (
    <div>
      <Heading>{t("offerConditions.domain")}</Heading>
      <Text className="text-ui-fg-subtle" size="small">
        {t("offerConditions.subtitle")}
      </Text>
    </div>
  )
}

export const OfferConditionListActions = ({
  children,
}: {
  children?: ReactNode
}) => {
  return (
    <div className="flex items-center justify-center gap-x-2">{children}</div>
  )
}

export const OfferConditionListHeader = ({
  children,
}: {
  children?: ReactNode
}) => {
  return (
    <div className="flex items-center justify-between px-6 py-4">
      {Children.count(children) > 0 ? (
        children
      ) : (
        <>
          <OfferConditionListTitle />
          <OfferConditionListActions />
        </>
      )}
    </div>
  )
}
