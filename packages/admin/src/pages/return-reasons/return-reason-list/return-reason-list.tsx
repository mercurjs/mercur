import { SingleColumnPage } from "../../../components/layout/pages"
import { useExtension } from "../../../providers/extension-provider"
import { ReturnReasonListTable } from "./components/return-reason-list-table"

export const ReturnReasonList = () => {
  const { getWidgets } = useExtension()

  return (
    <SingleColumnPage
      showMetadata={false}
      showJSON={false}
      hasOutlet
      widgets={{
        after: getWidgets("return_reason.list.after"),
        before: getWidgets("return_reason.list.before"),
      }}
    >
      <ReturnReasonListTable />
    </SingleColumnPage>
  )
}
