import { SingleColumnPage } from "../../../../../../POC PRojects/core-admin/src/components/layout/pages"
import { useExtension } from "../../../../../../POC PRojects/core-admin/src/providers/extension-provider"
import { PromotionListTable } from "./components/promotion-list-table"

export const PromotionsList = () => {
  const { getWidgets } = useExtension()

  return (
    <SingleColumnPage
      widgets={{
        before: getWidgets("promotion.list.before"),
        after: getWidgets("promotion.list.after"),
      }}
    >
      <PromotionListTable />
    </SingleColumnPage>
  )
}
