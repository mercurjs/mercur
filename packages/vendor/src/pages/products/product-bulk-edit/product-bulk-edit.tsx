import { useTranslation } from "react-i18next"
import { useLocation } from "react-router-dom"
import { RouteFocusModal } from "@components/modals"
import { ExtendedAdminProduct } from "../types"
import { ProductBulkEditForm } from "./components/product-bulk-edit-form"

type LocationState = {
  products?: ExtendedAdminProduct[]
}

export const ProductBulkEdit = () => {
  const { t } = useTranslation()
  const location = useLocation()
  const state = location.state as LocationState | null
  const products = state?.products || []

  const ready = products.length > 0

  return (
    <RouteFocusModal>
      <RouteFocusModal.Title asChild>
        <span className="sr-only">
          {t("products.bulkEdit.title")}
        </span>
      </RouteFocusModal.Title>
      <RouteFocusModal.Description asChild>
        <span className="sr-only">
          {t("products.bulkEdit.description")}
        </span>
      </RouteFocusModal.Description>
      {ready && <ProductBulkEditForm products={products} />}
    </RouteFocusModal>
  )
}
