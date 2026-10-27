import { UIMatch } from "react-router-dom"

import { usePayoutAccount } from "../../../hooks/api/payout-accounts"

export const PayoutAccountDetailBreadcrumb = (props: UIMatch) => {
  const { id } = props.params || {}

  const { payout_account } = usePayoutAccount(id!, undefined, {
    enabled: Boolean(id),
  })

  if (!payout_account) {
    return null
  }

  return (
    <span>
      {payout_account.seller?.name ?? payout_account.id}
    </span>
  )
}
