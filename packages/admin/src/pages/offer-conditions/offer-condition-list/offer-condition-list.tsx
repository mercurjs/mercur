import { Children, ReactNode } from "react"

import { SingleColumnPage, WidgetZone } from "@mercurjs/dashboard-shared"

import {
  OfferConditionListActions,
  OfferConditionListDataTable,
  OfferConditionListHeader,
  OfferConditionListTable,
  OfferConditionListTitle,
} from "./components/offer-condition-list-table"

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage showMetadata={false} showJSON={false} hasOutlet>
      <WidgetZone id="offer-conditions.list">
        {Children.count(children) > 0 ? children : <OfferConditionListTable />}
      </WidgetZone>
    </SingleColumnPage>
  )
}

export const OfferConditionList = Object.assign(Root, {
  Table: OfferConditionListTable,
  Header: OfferConditionListHeader,
  HeaderTitle: OfferConditionListTitle,
  HeaderActions: OfferConditionListActions,
  DataTable: OfferConditionListDataTable,
})
