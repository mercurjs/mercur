import { useLoaderData, useParams } from "react-router-dom"

import { SingleColumnPageSkeleton } from "../../../components/common/skeleton"
import { TwoColumnPage } from "../../../components/layout/pages"
import { useCustomer } from "../../../hooks/api/customers"
import { CustomerAddressSection } from "./components/customer-address-section/customer-address-section"
import { CustomerGeneralSection } from "./components/customer-general-section"
import { CustomerGroupSection } from "./components/customer-group-section"
import { CustomerOrderSection } from "./components/customer-order-section"
import { customerLoader } from "./loader"

export const CustomerDetail = () => {
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

  return (
    <TwoColumnPage
      data={customer}
      hasOutlet
      showJSON
      showMetadata
    >
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
