import { ReactNode, Children } from "react"
import { useLoaderData, useParams, LoaderFunctionArgs } from "react-router-dom"
import { HttpTypes } from "@medusajs/types"

import { SingleColumnPageSkeleton } from "@components/common/skeleton"
import { TwoColumnPage } from "@components/layout/pages"

import { useCustomer } from "@hooks/api/customers"
import { customersQueryKeys } from "@hooks/api/customers"
import { useExtension } from "@providers/extension-provider"
import { sdk } from "@lib/client"
import { queryClient } from "@lib/query-client"

import {
  CustomerDetailProvider,
  useCustomerDetailContext,
} from "./customer-detail-context"

import { CustomerGeneralSection } from "./sections/customer-general-section"
import { CustomerOrderSection } from "./sections/customer-order-section"
import { CustomerGroupSection } from "./sections/customer-group-section"
import { CustomerAddressSection } from "./sections/customer-address-section"

// Loader
const customerDetailQuery = (id: string) => ({
  queryKey: customersQueryKeys.detail(id),
  queryFn: async () =>
    sdk.admin.customer.retrieve(id, {
      fields: "+*addresses",
    }),
})

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id
  const query = customerDetailQuery(id!)

  return queryClient.ensureQueryData(query)
}

// Breadcrumb
export const Breadcrumb = (props: { params?: { id?: string }; data?: HttpTypes.AdminCustomerResponse }) => {
  const { id } = props.params || {}

  const { customer } = useCustomer(id!, undefined, {
    initialData: props.data,
    enabled: Boolean(id),
  })

  if (!customer) {
    return null
  }

  const name = [customer.first_name, customer.last_name]
    .filter(Boolean)
    .join(" ")

  const display = name || customer.email

  return <span>{display}</span>
}

// Sub-components that use context
function GeneralSection() {
  const { customer } = useCustomerDetailContext()
  return <CustomerGeneralSection customer={customer} />
}

function OrderSection() {
  const { customer } = useCustomerDetailContext()
  return <CustomerOrderSection customer={customer} />
}

function GroupSection() {
  const { customer } = useCustomerDetailContext()
  return <CustomerGroupSection customer={customer} />
}

function AddressSection() {
  const { customer } = useCustomerDetailContext()
  return <CustomerAddressSection customer={customer} />
}

// Layout components
function Main({ children }: { children?: ReactNode }) {
  if (children && Children.count(children) > 0) {
    return <TwoColumnPage.Main data-testid="customer-detail-main">{children}</TwoColumnPage.Main>
  }

  return (
    <TwoColumnPage.Main data-testid="customer-detail-main">
      <GeneralSection />
      <OrderSection />
      <GroupSection />
    </TwoColumnPage.Main>
  )
}

function Sidebar({ children }: { children?: ReactNode }) {
  if (children && Children.count(children) > 0) {
    return <TwoColumnPage.Sidebar data-testid="customer-detail-sidebar">{children}</TwoColumnPage.Sidebar>
  }

  return (
    <TwoColumnPage.Sidebar data-testid="customer-detail-sidebar">
      <AddressSection />
    </TwoColumnPage.Sidebar>
  )
}

// Props
export interface CustomerDetailPageProps {
  children?: ReactNode
}

// Root component
function CustomerDetailPageRoot({ children }: CustomerDetailPageProps) {
  const { id } = useParams()

  const initialData = useLoaderData() as Awaited<
    ReturnType<typeof loader>
  > | undefined

  const { customer, isLoading, isError, error } = useCustomer(
    id!,
    { fields: "+*addresses" },
    { initialData }
  )

  const { getWidgets } = useExtension()

  if (isLoading || !customer) {
    return <SingleColumnPageSkeleton sections={2} showJSON showMetadata />
  }

  if (isError) {
    throw error
  }

  const contextValue = {
    customer,
    isLoading,
    isError,
    error: error as Error | null,
  }

  const hasCustomChildren = Children.count(children) > 0

  return (
    <CustomerDetailProvider value={contextValue}>
      <div data-testid="customer-detail-page">
        <TwoColumnPage
          widgets={{
            before: getWidgets("customer.details.before"),
            after: getWidgets("customer.details.after"),
            sideAfter: getWidgets("customer.details.side.after"),
            sideBefore: getWidgets("customer.details.side.before"),
          }}
          data={customer}
          hasOutlet
          showJSON
          showMetadata
        >
          {hasCustomChildren ? (
            children
          ) : (
            <>
              <Main />
              <Sidebar />
            </>
          )}
        </TwoColumnPage>
      </div>
    </CustomerDetailProvider>
  )
}

// Compound component export
export const CustomerDetailPage = Object.assign(CustomerDetailPageRoot, {
  Main,
  Sidebar,
  GeneralSection,
  OrderSection,
  GroupSection,
  AddressSection,
  useContext: useCustomerDetailContext,
})
