import { Container } from "@medusajs/ui"
import { WidgetZone } from "@mercurjs/dashboard-shared"
import { Children, ReactNode } from "react"

import { SingleColumnPage } from "../../../components/layout/pages"
import {
  ShippingMethodListActions,
  ShippingMethodListDataTable,
  ShippingMethodListHeader,
  ShippingMethodListTitle,
} from "./components/shipping-method-list-table"

const ShippingMethodListTable = ({ children }: { children?: ReactNode }) => (
  <Container className="divide-y p-0" data-testid="shipping-method-list-table">
    {Children.count(children) > 0 ? (
      children
    ) : (
      <>
        <ShippingMethodListHeader />
        <ShippingMethodListDataTable />
      </>
    )}
  </Container>
)

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage>
      <WidgetZone id="shipping-methods.list">
        {Children.count(children) > 0 ? children : <ShippingMethodListTable />}
      </WidgetZone>
    </SingleColumnPage>
  )
}

export const ShippingMethodListPage = Object.assign(Root, {
  Table: ShippingMethodListTable,
  Header: ShippingMethodListHeader,
  HeaderTitle: ShippingMethodListTitle,
  HeaderActions: ShippingMethodListActions,
  DataTable: ShippingMethodListDataTable,
})
