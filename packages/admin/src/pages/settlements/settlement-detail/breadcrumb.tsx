import { UIMatch } from "react-router-dom"

import { useSettlement } from "../../../hooks/api/settlements"

export const SettlementDetailBreadcrumb = (props: UIMatch) => {
  const { id } = props.params || {}

  const { settlement } = useSettlement(id!, undefined, {
    enabled: Boolean(id),
  })

  if (!settlement) {
    return null
  }

  return <span>#{settlement.display_id}</span>
}
