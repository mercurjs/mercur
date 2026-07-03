import { useTranslation } from "react-i18next"
import { useSearchParams } from "react-router-dom"

import { RouteFocusModal } from "../../../components/modals"
import { useProducts } from "../../../hooks/api/products"
import { PRODUCT_IDS_KEY } from "../common/constants"
import { ProductBulkEditForm } from "./components/product-bulk-edit-form"

export const ProductBulkEdit = () => {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()

  const productIds = searchParams.get(PRODUCT_IDS_KEY)?.split(",") || undefined

  const { products, isPending, isError, error } = useProducts(
    {
      id: productIds,
      limit: productIds?.length || 0,
      fields: "id,title,status,discountable",
    },
    { enabled: !!productIds?.length }
  )

  const ready = !isPending && !!products && !!productIds?.length

  if (isError) {
    throw error
  }

  return (
    <RouteFocusModal>
      <RouteFocusModal.Title asChild>
        <span className="sr-only">{t("products.bulkEdit.title")}</span>
      </RouteFocusModal.Title>
      <RouteFocusModal.Description asChild>
        <span className="sr-only">{t("products.bulkEdit.description")}</span>
      </RouteFocusModal.Description>
      {ready && <ProductBulkEditForm products={products} />}
    </RouteFocusModal>
  )
}
