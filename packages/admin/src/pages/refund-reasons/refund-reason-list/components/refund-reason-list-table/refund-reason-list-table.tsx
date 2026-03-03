import { Children, ReactNode } from "react"

import { RefundReasonListDataTable } from "./refund-reason-list-data-table"

export { RefundReasonListDataTable } from "./refund-reason-list-data-table"
export {
  RefundReasonListHeader,
  RefundReasonListTitle,
  RefundReasonListActions,
} from "./refund-reason-list-header"

export const RefundReasonListTable = ({ children }: { children?: ReactNode }) => {
  return Children.count(children) > 0 ? (
    <>{children}</>
  ) : (
    <RefundReasonListDataTable />
  )
}
