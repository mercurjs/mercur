import { Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"

import { RouteDrawer } from "../../../components/modals"
import { useSeller } from "../../../hooks/api/sellers"
import { SellerEditForm } from "./components/seller-edit-form"

export const SellerEdit = () => {
  const { id } = useParams()
  const { t } = useTranslation()

  const { seller, isLoading, isError, error } = useSeller(id!)

  if (isError) {
    throw error
  }

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <RouteDrawer.Title asChild>
          <Heading>{t("sellers.edit.header")}</Heading>
        </RouteDrawer.Title>
      </RouteDrawer.Header>
      {!isLoading && seller && <SellerEditForm seller={seller} />}
    </RouteDrawer>
  )
}
