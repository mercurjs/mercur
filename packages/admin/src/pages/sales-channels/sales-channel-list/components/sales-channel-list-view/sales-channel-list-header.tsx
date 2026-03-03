import { Children, ReactNode } from "react"
import { Button, Heading, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

export const SalesChannelListTitle = () => {
  const { t } = useTranslation()
  return (
    <div>
      <Heading>{t("salesChannels.domain")}</Heading>
      <Text className="text-ui-fg-subtle" size="small">
        {t("salesChannels.subtitle")}
      </Text>
    </div>
  )
}

export const SalesChannelListActions = ({
  children,
}: {
  children?: ReactNode
}) => {
  const { t } = useTranslation()
  return (
    <div className="flex items-center justify-center gap-x-2">
      {Children.count(children) > 0 ? (
        children
      ) : (
        <Button size="small" variant="secondary" asChild>
          <Link to="/settings/sales-channels/create">
            {t("actions.create")}
          </Link>
        </Button>
      )}
    </div>
  )
}

export const SalesChannelListHeader = ({
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
          <SalesChannelListTitle />
          <SalesChannelListActions />
        </>
      )}
    </div>
  )
}
