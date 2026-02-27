import { UIMatch } from "react-router-dom"

import { useSeller } from "../../../hooks/api"

export const SellerDetailBreadcrumb = (props: UIMatch) => {
  const { id } = props.params || {}

  const { seller } = useSeller(id!, undefined, {
    enabled: Boolean(id),
  })

  if (!seller) {
    return null
  }

  return <span>{seller.name || seller.email}</span>
}
