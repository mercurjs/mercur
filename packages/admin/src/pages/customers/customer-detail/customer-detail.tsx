import { ComponentProps, ReactNode } from "react"
import { useLoaderData, useParams } from "react-router-dom"

import { SingleColumnPageSkeleton } from "../../../components/common/skeleton"
import { TwoColumnPage } from "../../../components/layout/pages"
import { useCustomer } from "../../../hooks/api/customers"
import { hasExplicitCompoundComposition } from "../../../lib/compound-composition"
import { CustomerAddressSection } from "./components/customer-address-section/customer-address-section"
import { CustomerGeneralSection } from "./components/customer-general-section"
import { CustomerGroupSection } from "./components/customer-group-section"
import { CustomerOrderSection } from "./components/customer-order-section"
import { CustomerDetailProvider, useCustomerDetailContext } from "./context"
import { customerLoader } from "./loader"

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

  return (
    <CustomerDetailProvider customer={customer}>
      {hasExplicitCompoundComposition(children, [
        Layout,
        TwoColumnPage.Main,
        TwoColumnPage.Sidebar,
      ]) ? (
        children
      ) : (
        <Layout>
          <TwoColumnPage.Main>
            <CustomerGeneralSection />
            <CustomerOrderSection />
            <CustomerGroupSection />
          </TwoColumnPage.Main>
          <TwoColumnPage.Sidebar>
            <CustomerAddressSection />
          </TwoColumnPage.Sidebar>
        </Layout>
      )}
    </CustomerDetailProvider>
  )
}

const Layout = ({
  children,
  ...props
}: Omit<ComponentProps<typeof TwoColumnPage>, "data"> & {
  children: ReactNode
}) => {
  const { customer } = useCustomerDetailContext()
  return (
    <TwoColumnPage data={customer} hasOutlet showJSON showMetadata {...props}>
      {children}
    </TwoColumnPage>
  )
}

export const CustomerDetailPage = Object.assign(Root, {
  Layout,
  Main: TwoColumnPage.Main,
  Sidebar: TwoColumnPage.Sidebar,
  MainGeneralSection: CustomerGeneralSection,
  MainOrderSection: CustomerOrderSection,
  MainGroupSection: CustomerGroupSection,
  SidebarAddressSection: CustomerAddressSection,
  useContext: useCustomerDetailContext,
})
