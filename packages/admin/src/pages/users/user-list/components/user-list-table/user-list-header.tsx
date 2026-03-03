import { Children, ReactNode } from "react"
import { Button, Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

export const UserListTitle = () => {
  const { t } = useTranslation()
  return (
    <div>
      <Heading level="h2">{t("users.domain")}</Heading>
    </div>
  )
}

export const UserListActions = ({
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

export const UserListHeader = ({
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
          <UserListTitle />
          <UserListActions />
        </>
      )}
    </div>
  )
}
