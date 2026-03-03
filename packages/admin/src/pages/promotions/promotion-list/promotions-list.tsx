import { Children, ReactNode } from "react"

import { SingleColumnPage } from "../../../components/layout/pages"
import { PromotionListTable } from "./components/promotion-list-table"

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage>
      {Children.count(children) > 0 ? children : <PromotionListTable />}
    </SingleColumnPage>
  )
}

export const PromotionsList = Object.assign(Root, {
  Table: PromotionListTable,
})
