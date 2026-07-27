import { Children, ReactNode } from "react"

import { WidgetZone } from "@mercurjs/dashboard-shared"

import { SingleColumnPage } from "../../../components/layout/pages"
import {
  PromotionListTable,
  PromotionListHeader,
  PromotionListTitle,
  PromotionListActions,
  PromotionListCreateButton,
  PromotionListDataTable,
} from "./components/promotion-list-table"

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage>
      <WidgetZone id="promotions.list">
        {Children.count(children) > 0 ? children : <PromotionListTable />}
      </WidgetZone>
    </SingleColumnPage>
  )
}

export const PromotionListPage = Object.assign(Root, {
  Table: PromotionListTable,
  Header: PromotionListHeader,
  HeaderTitle: PromotionListTitle,
  HeaderActions: PromotionListActions,
  HeaderCreateButton: PromotionListCreateButton,
  DataTable: PromotionListDataTable,
})
