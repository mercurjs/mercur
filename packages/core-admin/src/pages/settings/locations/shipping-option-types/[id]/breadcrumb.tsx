import { useShippingOptionType } from "@hooks/api"

import type { HttpTypes } from "@medusajs/types"
import type { UIMatch } from "react-router-dom"

type ShippingOptionTypeDetailBreadcrumbProps =
  UIMatch<HttpTypes.AdminShippingOptionTypeResponse>

export const ShippingOptionTypeDetailBreadcrumb = (
  props: ShippingOptionTypeDetailBreadcrumbProps
) => {
  const { id } = props.params || {}

  const { shipping_option_type } = useShippingOptionType(id!, undefined, {
    initialData: props.data,
    enabled: Boolean(id),
  })

  if (!shipping_option_type) {
    return null
  }

  return <span>{shipping_option_type.label}</span>
}
