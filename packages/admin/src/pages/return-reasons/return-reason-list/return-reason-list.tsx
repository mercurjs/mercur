import { SingleColumnPage } from "../../../components/layout/pages"
import { ReturnReasonListTable } from "./components/return-reason-list-table"

export const ReturnReasonList = () => {
  return (
    <SingleColumnPage
      showMetadata={false}
      showJSON={false}
      hasOutlet
    >
      <ReturnReasonListTable />
    </SingleColumnPage>
  )
}
