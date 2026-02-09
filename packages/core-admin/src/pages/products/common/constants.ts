import { getLinkedFields } from "../../../dashboard-app"

export const PRODUCT_VARIANT_IDS_KEY = "product_variant_ids"

export const PRODUCT_DETAIL_FIELDS = getLinkedFields(
  "product",
  "*categories,*shipping_profile,-variants"
)
