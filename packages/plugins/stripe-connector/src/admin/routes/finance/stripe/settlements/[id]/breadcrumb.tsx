import type { UIMatch } from "react-router-dom"

import { useStripeSettlement } from "../../../../../hooks/api/stripe"

export const SettlementDetailBreadcrumb = (props: UIMatch) => {
  const { id } = props.params || {}

  const { settlement } = useStripeSettlement(id!, { enabled: Boolean(id) })

  if (!settlement) {
    return null
  }

  return <span>#{settlement.display_id}</span>
}
