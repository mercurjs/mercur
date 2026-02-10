import { HttpTypes } from "@medusajs/types"

export function isReturnOption(shippingOption: HttpTypes.AdminShippingOption) {
  return !!shippingOption.rules?.find(
    (r) => r.attribute === "is_return" && r.value === "true"
  )
}

export function isOptionEnabledInStore(
  shippingOption: HttpTypes.AdminShippingOption
) {
  return !!shippingOption.rules?.find(
    (r) =>
      r.attribute === "enabled_in_store" &&
      r.value === "true" &&
      r.operator === "eq"
  )
}

export function getShippingProfileName(name: string) {
  return name.split(":")[1]
}

export function isSameLocation(
  shippingOption: HttpTypes.AdminShippingOption,
  locationId: string
) {
  return (
    shippingOption?.service_zone?.fulfillment_set?.location?.id === locationId
  )
}
