import { ReactNode, Children } from "react"

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
      {Children.count(children) > 0 ? children : <ShippingProfileListView />}
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
