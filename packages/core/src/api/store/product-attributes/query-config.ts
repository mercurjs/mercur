import {
  buildAllowedFields,
  prefixAllowedFields,
} from "@medusajs/medusa/api/store/utils/allowed-fields"

export const storeProductAttributeFields = [
  "id",
  "name",
  "handle",
  "description",
  "type",
  "is_required",
  "is_filterable",
  "is_variant_axis",
  "product_id",
  "rank",
  "metadata",
  "created_at",
  "updated_at",
  "*values",
]

const storeProductAttributeValueFields = [
  "id",
  "handle",
  "name",
  "rank",
  "metadata",
  "attribute_id",
  "product_option_value_id",
]

const allowed = buildAllowedFields(
  storeProductAttributeFields,
  prefixAllowedFields("values", storeProductAttributeValueFields)
)

export const storeProductAttributeQueryConfig = {
  list: {
    defaults: storeProductAttributeFields,
    allowed,
    defaultLimit: 50,
    isList: true,
  },
  retrieve: {
    defaults: storeProductAttributeFields,
    allowed,
    isList: false,
  },
}
