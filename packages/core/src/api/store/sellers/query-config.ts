import { buildAllowedFields } from "@medusajs/medusa/api/store/utils/allowed-fields"

export const storeSellerFields = [
  "id",
  "name",
  "handle",
  "description",
  "logo",
  "banner",
  "is_premium",
  "metadata",
]

export const allowedStoreSellerExtraFields = [
  "email",
  "phone",
  "website_url",
  "default_leadtime_to_ship",
  "closed_from",
  "closed_to",
  "closure_note",
  "created_at",
  "updated_at",
]

const allowed = buildAllowedFields(storeSellerFields, allowedStoreSellerExtraFields)

export const listSellerQueryConfig = {
  defaults: storeSellerFields,
  allowed,
  defaultLimit: 50,
  isList: true,
}

export const retrieveSellerQueryConfig = {
  defaults: storeSellerFields,
  allowed,
}
