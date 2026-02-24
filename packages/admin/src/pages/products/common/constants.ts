import { getLinkedFields } from "../../../../../../POC PRojects/core-admin/src/dashboard-app"

export const PRODUCT_VARIANT_IDS_KEY = "product_variant_ids"

export const PRODUCT_DETAIL_FIELDS = getLinkedFields(
  "product",
  "*categories,*shipping_profile,-variants"
)
