// Route: /products/:id/attributes/create
import { Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"

import { RouteDrawer } from "@components/modals"
import { CreateAttributeForm } from "./components/create-attribute-form"

export const Component = () => {
  const { id } = useParams()
  const { t } = useTranslation()

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <Heading>{t("products.addAttribute")}</Heading>
      </RouteDrawer.Header>
      <CreateAttributeForm productId={id!} />
    </RouteDrawer>
  )
}
