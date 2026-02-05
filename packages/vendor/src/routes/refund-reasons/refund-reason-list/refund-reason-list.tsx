import { SingleColumnPage } from "../../../components/layout/pages"
import { RefundReasonListTable } from "./components/refund-reason-list-table"

export const RefundReasonList = () => {
  return (
    <SingleColumnPage
      showMetadata={false}
      showJSON={false}
      hasOutlet
    >
      <RefundReasonListTable />
    </SingleColumnPage>
  )
}
