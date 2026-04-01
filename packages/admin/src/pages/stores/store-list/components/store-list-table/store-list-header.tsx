import { ReactNode, Children } from "react"
import { Button, Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

export const StoreListTitle = () => {
  return (
    <div>
      <Heading level="h2">Stores</Heading>
    </div>
  )
}

export const StoreListActions = ({
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
        <Link to="create">
          <Button variant="secondary" size="small">
            {t("actions.create")}
          </Button>
        </Link>
      )}
    </div>
  )
}

export const StoreListHeader = ({
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
          <StoreListTitle />
          <StoreListActions />
        </>
      )}
    </div>
  )
}
