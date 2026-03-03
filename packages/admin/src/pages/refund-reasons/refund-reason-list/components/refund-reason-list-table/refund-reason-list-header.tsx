import { Children, ReactNode } from "react"
import { Heading, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

export const RefundReasonListTitle = () => {
  const { t } = useTranslation()
  return (
    <div>
      <Heading>{t("refundReasons.domain")}</Heading>
      <Text className="text-ui-fg-subtle" size="small">
        {t("refundReasons.subtitle")}
      </Text>
    </div>
  )
}

export const RefundReasonListActions = ({
  children,
}: {
  children?: ReactNode
}) => {
  return (
    <div className="flex items-center justify-center gap-x-2">{children}</div>
  )
}

export const RefundReasonListHeader = ({
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
          <RefundReasonListTitle />
          <RefundReasonListActions />
        </>
      )}
    </div>
  )
}
