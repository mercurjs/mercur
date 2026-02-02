import { SingleColumnPage } from "@components/layout/pages"
import { useExtension } from "@providers/extension-provider"

import { PromotionListTable } from "./_components/promotion-list-table"

const PromotionsList = () => {
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

export { promotionsLoader } from "./loader"
export const Component = PromotionsList
