import { ReactNode, Children } from "react"
import { Button, Heading, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

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

export const CollectionListActions = ({
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
        <Link to="/collections/create">
          <Button size="small" variant="secondary">
            {t("actions.create")}
          </Button>
        </Link>
      )}
    </div>
  )
}

export const CollectionListHeader = ({
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
          <CollectionListTitle />
          <CollectionListActions />
        </>
      )}
    </div>
  )
}
