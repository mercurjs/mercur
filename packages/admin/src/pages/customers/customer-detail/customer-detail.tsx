import { ReactNode } from "react"
import { useLoaderData, useParams } from "react-router-dom"

import { SingleColumnPageSkeleton } from "../../../components/common/skeleton"
import { TwoColumnPage } from "../../../components/layout/pages"
import { useCustomer } from "../../../hooks/api/customers"
import { hasExplicitCompoundComposition } from "../../../lib/compound-composition"
import { CustomerAddressSection } from "./components/customer-address-section/customer-address-section"
import { CustomerGeneralSection } from "./components/customer-general-section"
import { CustomerGroupSection } from "./components/customer-group-section"
import { CustomerOrderSection } from "./components/customer-order-section"
import { customerLoader } from "./loader"

const ALLOWED_TYPES = [
  TwoColumnPage.Main,
  TwoColumnPage.Sidebar,
  CustomerGeneralSection,
  CustomerOrderSection,
  CustomerGroupSection,
  CustomerAddressSection,
] as const

const Root = ({ children }: { children?: ReactNode }) => {
  const { id } = useParams()

  const initialData = useLoaderData() as Awaited<
    ReturnType<typeof customerLoader>
  >
  const { customer, isLoading, isError, error } = useCustomer(
    id!,
    { fields: "+*addresses" },
    { initialData }
  )

  if (isLoading || !customer) {
    return <SingleColumnPageSkeleton sections={2} showJSON showMetadata />
  }

  if (isError) {
    throw error
  }

  return hasExplicitCompoundComposition(children, ALLOWED_TYPES) ? (
    <TwoColumnPage data={customer} hasOutlet showJSON showMetadata>{children}</TwoColumnPage>
  ) : (
    <TwoColumnPage data={customer} hasOutlet showJSON showMetadata>
      <TwoColumnPage.Main>
        <CustomerGeneralSection customer={customer} />
        <CustomerOrderSection customer={customer} />
        <CustomerGroupSection customer={customer} />
      </TwoColumnPage.Main>
      <TwoColumnPage.Sidebar>
        <CustomerAddressSection customer={customer} />
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
