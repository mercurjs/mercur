import { ReactNode } from "react"

import { SingleColumnPage } from "../../../components/layout/pages"
import { hasExplicitCompoundComposition } from "../../../lib/compound-composition"
import {
  ShippingProfileListView,
  ShippingProfileListDataTable,
  ShippingProfileListHeader,
  ShippingProfileListActions,
  ShippingProfileListTitle,
} from "./components/shipping-profile-list-view"

const ALLOWED_TYPES = [ShippingProfileListView] as const

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage>
      {hasExplicitCompoundComposition(children, ALLOWED_TYPES) ? children : <ShippingProfileListView />}
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
