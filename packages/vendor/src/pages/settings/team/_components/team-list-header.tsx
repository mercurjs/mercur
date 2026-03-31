import { Children, ReactNode } from "react"
import { Button, Heading, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

export const TeamListTitle = () => {
  const { t } = useTranslation()
  return (
    <div>
      <Heading level="h2">{t("users.domain")}</Heading>
      <Text className="text-ui-fg-subtle" size="small">
        {t("users.list.empty.description")}
      </Text>
    </div>
  )
}

export const TeamListActions = ({
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
        <Link to="invite">
          <Button size="small" variant="secondary">
            {t("users.invite")}
          </Button>
        </Link>
      )}
    </div>
  )
}

export const TeamListHeader = ({
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
          <TeamListTitle />
          <TeamListActions />
        </>
      )}
    </div>
  )
}
