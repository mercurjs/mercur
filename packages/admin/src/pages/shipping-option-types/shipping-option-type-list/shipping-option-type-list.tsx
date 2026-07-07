import { ReactNode, Children } from "react"

import { WidgetZone } from "@mercurjs/dashboard-shared"

import { SingleColumnPage } from "../../../components/layout/pages"
import {
  ShippingOptionTypeListView,
  ShippingOptionTypeListDataTable,
  ShippingOptionTypeListHeader,
  ShippingOptionTypeListActions,
  ShippingOptionTypeListTitle,
} from "./components/shipping-option-type-list-view"

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage>
      <WidgetZone id="shipping-option-types.list">
        {Children.count(children) > 0 ? children : <ShippingOptionTypeListView />}
      </WidgetZone>
    </SingleColumnPage>
  )
}

export const ShippingOptionTypeListPage = Object.assign(Root, {
  Table: ShippingOptionTypeListView,
  Header: ShippingOptionTypeListHeader,
  HeaderTitle: ShippingOptionTypeListTitle,
  HeaderActions: ShippingOptionTypeListActions,
  DataTable: ShippingOptionTypeListDataTable,
})
