import { UIMatch } from "react-router-dom"

import { usePayout } from "../../../hooks/api/payouts"

export const PayoutDetailBreadcrumb = (props: UIMatch) => {
  const { id } = props.params || {}

  const { payout } = usePayout(id!, undefined, {
    enabled: Boolean(id),
  })

  if (!payout) {
    return null
  }

  return <span>#{payout.display_id}</span>
}
