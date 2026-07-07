import { ReactNode, Children } from "react"

import { WidgetZone } from "@mercurjs/dashboard-shared"

import { SingleColumnPage } from "../../../components/layout/pages"
import {
  ShippingProfileListView,
  ShippingProfileListDataTable,
  ShippingProfileListHeader,
  ShippingProfileListActions,
  ShippingProfileListTitle,
} from "./components/shipping-profile-list-view"

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage>
      <WidgetZone id="shipping-profiles.list">
        {Children.count(children) > 0 ? children : <ShippingProfileListView />}
      </WidgetZone>
    </SingleColumnPage>
  )
}

export const ShippingProfileListPage = Object.assign(Root, {
  Table: ShippingProfileListView,
  Header: ShippingProfileListHeader,
  HeaderTitle: ShippingProfileListTitle,
  HeaderActions: ShippingProfileListActions,
  DataTable: ShippingProfileListDataTable,
})
