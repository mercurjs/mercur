import { ReactNode } from "react"

import { SingleColumnPage } from "../../../components/layout/pages"
import { hasExplicitCompoundComposition } from "../../../lib/compound-composition"
import {
  ShippingOptionTypeListView,
  ShippingOptionTypeListDataTable,
  ShippingOptionTypeListHeader,
  ShippingOptionTypeListActions,
  ShippingOptionTypeListTitle,
} from "./components/shipping-option-type-list-view"

const ALLOWED_TYPES = [ShippingOptionTypeListView] as const

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage>
      {hasExplicitCompoundComposition(children, ALLOWED_TYPES) ? children : <ShippingOptionTypeListView />}
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
