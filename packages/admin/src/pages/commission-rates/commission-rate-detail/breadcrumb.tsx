import { UIMatch } from "react-router-dom"
import { useCommissionRate } from "../../../hooks/api/commission-rates"

export const CommissionRateDetailBreadcrumb = (props: UIMatch) => {
  const { id } = props.params || {}

  const { commission_rate } = useCommissionRate(id!, undefined, {
    initialData: props.data as any,
    enabled: Boolean(id),
  })

  if (!commission_rate) {
    return null
  }

  return <span>{commission_rate.name}</span>
}
