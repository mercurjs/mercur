import { useLoaderData, useParams } from "react-router-dom"

import { CORE_LAYOUT_IDS } from "@mercurjs/dashboard-sdk"
import {
  LayoutComposer,
  PermissionGuard,
  detailPageDefaultEntries,
  useLinkQuery,
} from "@mercurjs/dashboard-shared"
import { SingleColumnPageSkeleton } from "../../../components/common/skeleton"
import { useCustomer } from "../../../hooks/api/customers"
import { CustomerAddressSection } from "./components/customer-address-section/customer-address-section"
import { CustomerGeneralSection } from "./components/customer-general-section"
import { CustomerGroupSection } from "./components/customer-group-section"
import { CustomerOrderSection } from "./components/customer-order-section"
import { customerLoader } from "./loader"

export const CustomerDetailPage = () => {
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

  return (
    <LayoutComposer
      widgetsZonePrefix="customers.detail"
      preferredLayoutId={CORE_LAYOUT_IDS.TWO_COLUMN}
      data={customer}
      sections={{
        main: (
          <>
            <LayoutComposer.Entry id="CustomerGeneralSection">
              <CustomerGeneralSection customer={customer} />
            </LayoutComposer.Entry>
            <LayoutComposer.Entry id="CustomerOrderSection">
              <PermissionGuard permission="orders:view">
                <CustomerOrderSection customer={customer} />
              </PermissionGuard>
            </LayoutComposer.Entry>
            <LayoutComposer.Entry id="CustomerGroupSection">
              <PermissionGuard permission="customer_groups:view">
                <CustomerGroupSection customer={customer} />
              </PermissionGuard>
            </LayoutComposer.Entry>
            {detailPageDefaultEntries(customer)}
          </>
        ),
        side: (
          <>
            <LayoutComposer.Entry id="CustomerAddressSection">
              <CustomerAddressSection customer={customer} />
            </LayoutComposer.Entry>
          </>
        ),
      }}
    />
  )
}
