// Route: /promotions
import { SingleColumnPage } from "@components/layout/pages"
import { useDashboardExtension } from "@/extensions"
import { PromotionListTable } from "./_components/promotion-list-table"

export const Component = () => {
  const { getWidgets } = useDashboardExtension()

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
