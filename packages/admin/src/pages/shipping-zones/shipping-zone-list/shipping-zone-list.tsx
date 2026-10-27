import { Container } from "@medusajs/ui"
import { WidgetZone } from "@mercurjs/dashboard-shared"
import { Children, ReactNode } from "react"

import { SingleColumnPage } from "../../../components/layout/pages"
import {
  ShippingZoneListActions,
  ShippingZoneListDataTable,
  ShippingZoneListHeader,
  ShippingZoneListTitle,
} from "./components/shipping-zone-list-table"

const ShippingZoneListTable = ({ children }: { children?: ReactNode }) => (
  <Container className="divide-y p-0" data-testid="shipping-zone-list-table">
    {Children.count(children) > 0 ? (
      children
    ) : (
      <>
        <ShippingZoneListHeader />
        <ShippingZoneListDataTable />
      </>
    )}
  </Container>
)

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage>
      <WidgetZone id="shipping-zones.list">
        {Children.count(children) > 0 ? children : <ShippingZoneListTable />}
      </WidgetZone>
    </SingleColumnPage>
  )
}

export const ShippingZoneListPage = Object.assign(Root, {
  Table: ShippingZoneListTable,
  Header: ShippingZoneListHeader,
  HeaderTitle: ShippingZoneListTitle,
  HeaderActions: ShippingZoneListActions,
  DataTable: ShippingZoneListDataTable,
})
