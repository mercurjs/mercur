import { Children, ReactNode } from "react"
import { useLoaderData, useParams } from "react-router-dom"
import { useLinkQuery, WidgetZone } from "@mercurjs/dashboard-shared"

import { SingleColumnPage } from "../../../components/layout/pages"
import { useCustomerGroup } from "../../../hooks/api/customer-groups"
import { CustomerGroupCustomerSection } from "./components/customer-group-customer-section"
import { CustomerGroupGeneralSection } from "./components/customer-group-general-section"
import { customerGroupLoader } from "./loader"

import { SingleColumnPageSkeleton } from "../../../components/common/skeleton"
import { CUSTOMER_GROUP_DETAIL_FIELDS } from "./constants"

const Root = ({ children }: { children?: ReactNode }) => {
  const initialData = useLoaderData() as Awaited<
    ReturnType<typeof customerGroupLoader>
  >

  const { id } = useParams()
  const query = useLinkQuery("customer_group", CUSTOMER_GROUP_DETAIL_FIELDS)
  const { customer_group, isLoading, isError, error } = useCustomerGroup(
    id!,
    query,
    { initialData },
  )

  if (isLoading || !customer_group) {
    return <SingleColumnPageSkeleton sections={2} showJSON showMetadata />
  }

  if (isError) {
    throw error
  }

  return Children.count(children) > 0 ? (
    <SingleColumnPage showJSON showMetadata data={customer_group}>
      {children}
    </SingleColumnPage>
  ) : (
    <SingleColumnPage showJSON showMetadata data={customer_group}>
      <WidgetZone id="customer-groups.detail.main" data={customer_group}>
        <CustomerGroupGeneralSection group={customer_group} />
        <CustomerGroupCustomerSection group={customer_group} />
      </WidgetZone>
    </SingleColumnPage>
  )
}

export const CustomerGroupDetailPage = Object.assign(Root, {
  GeneralSection: CustomerGroupGeneralSection,
  CustomerSection: CustomerGroupCustomerSection,
})
