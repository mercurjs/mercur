import { UIMatch } from "react-router-dom"

import { usePayoutCapture } from "../../../hooks/api/payout-captures"

export const PayoutCaptureDetailBreadcrumb = (props: UIMatch) => {
  const { id } = props.params || {}

  const { capture } = usePayoutCapture(id!, { enabled: Boolean(id) })

  if (!capture) {
    return null
  }

  return (
    <span>
      {capture.order_group_display_id
        ? `#${capture.order_group_display_id}`
        : capture.order_group_id}
    </span>
  )
}
