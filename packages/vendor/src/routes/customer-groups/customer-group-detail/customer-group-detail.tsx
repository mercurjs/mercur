import { useLoaderData, useParams } from "react-router-dom"

import { SingleColumnPage } from "../../../components/layout/pages"
import { useCustomerGroup } from "../../../hooks/api/customer-groups"
import { CustomerGroupCustomerSection } from "./components/customer-group-customer-section"
import { CustomerGroupGeneralSection } from "./components/customer-group-general-section"
import { customerGroupLoader } from "./loader"

import { SingleColumnPageSkeleton } from "../../../components/common/skeleton"

import { CUSTOMER_GROUP_DETAIL_FIELDS } from "./constants"

export const CustomerGroupDetail = () => {
  const initialData = useLoaderData() as Awaited<
    ReturnType<typeof customerGroupLoader>
  >

  const { id } = useParams()
  const { customer_group, isLoading, isError, error } = useCustomerGroup(
    id!,
    {
      fields: CUSTOMER_GROUP_DETAIL_FIELDS,
    },
    { initialData }
  )


  if (isLoading || !customer_group) {
    return <SingleColumnPageSkeleton sections={2} showJSON showMetadata />
  }

  if (isError) {
    throw error
  }

  return (
    <SingleColumnPage
      showJSON
      showMetadata
      data={customer_group}
    >
      <CustomerGroupGeneralSection group={customer_group} />
      <CustomerGroupCustomerSection group={customer_group} />
    </SingleColumnPage>
  )
}
