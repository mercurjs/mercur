import { ReactNode, Children } from "react"
import { useLoaderData, useParams } from "react-router-dom"

import { WidgetZone, useLinkQuery } from "@mercurjs/dashboard-shared"
import { SingleColumnPageSkeleton } from "../../../components/common/skeleton"
import { TwoColumnPage } from "../../../components/layout/pages"
import { useCustomer } from "../../../hooks/api/customers"
import { CustomerAddressSection } from "./components/customer-address-section/customer-address-section"
import { CustomerGeneralSection } from "./components/customer-general-section"
import { CustomerGroupSection } from "./components/customer-group-section"
import { CustomerOrderSection } from "./components/customer-order-section"
import { customerLoader } from "./loader"

const Root = ({ children }: { children?: ReactNode }) => {
  const { id } = useParams()

  const initialData = useLoaderData() as Awaited<
    ReturnType<typeof customerLoader>
  >
  const query = useLinkQuery("customer", "+*addresses")
  const { customer, isLoading, isError, error } = useCustomer(id!, query, {
    initialData,
  })

  if (isLoading || !customer) {
    return <SingleColumnPageSkeleton sections={2} showJSON showMetadata />
  }

  if (isError) {
    throw error
  }

  return Children.count(children) > 0 ? (
    <TwoColumnPage data={customer} hasOutlet showJSON showMetadata>{children}</TwoColumnPage>
  ) : (
    <TwoColumnPage data={customer} hasOutlet showJSON showMetadata>
      <TwoColumnPage.Main>
        <WidgetZone id="customers.detail.main" data={customer}>
          <CustomerGeneralSection customer={customer} />
          <CustomerOrderSection customer={customer} />
          <CustomerGroupSection customer={customer} />
        </WidgetZone>
      </TwoColumnPage.Main>
      <TwoColumnPage.Sidebar>
        <WidgetZone id="customers.detail.side" data={customer}>
          <CustomerAddressSection customer={customer} />
        </WidgetZone>
      </TwoColumnPage.Sidebar>
    </TwoColumnPage>
  )
}

export const CustomerDetailPage = Object.assign(Root, {
  Main: TwoColumnPage.Main,
  Sidebar: TwoColumnPage.Sidebar,
  MainGeneralSection: CustomerGeneralSection,
  MainOrderSection: CustomerOrderSection,
  MainGroupSection: CustomerGroupSection,
  SidebarAddressSection: CustomerAddressSection,
})
