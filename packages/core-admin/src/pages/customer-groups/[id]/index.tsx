import { useLoaderData, useParams } from "react-router-dom"
import { HttpTypes } from "@medusajs/types"
import { UIMatch } from "react-router-dom"

import { SingleColumnPage } from "@components/layout/pages"
import { SingleColumnPageSkeleton } from "@components/common/skeleton"
import { useCustomerGroup } from "@hooks/api/customer-groups"
import { useExtension } from "@providers/extension-provider"
import { CustomerGroupCustomerSection } from "./_components/customer-group-customer-section"
import { CustomerGroupGeneralSection } from "./_components/customer-group-general-section"
import { customerGroupLoader } from "./loader"
import { CUSTOMER_GROUP_DETAIL_FIELDS } from "./constants"

export const Component = () => {
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

  const { getWidgets } = useExtension()

  if (isLoading || !customer_group) {
    return <SingleColumnPageSkeleton sections={2} showJSON showMetadata />
  }

  if (isError) {
    throw error
  }

  return (
    <SingleColumnPage
      widgets={{
        before: getWidgets("customer_group.details.before"),
        after: getWidgets("customer_group.details.after"),
      }}
      showJSON
      showMetadata
      data={customer_group}
    >
      <CustomerGroupGeneralSection group={customer_group} />
      <CustomerGroupCustomerSection group={customer_group} />
    </SingleColumnPage>
  )
}

export const loader = customerGroupLoader

type CustomerGroupDetailBreadcrumbProps =
  UIMatch<HttpTypes.AdminCustomerGroupResponse>

export const Breadcrumb = (props: CustomerGroupDetailBreadcrumbProps) => {
  const { id } = props.params || {}

  const { customer_group } = useCustomerGroup(
    id!,
    {
      fields: CUSTOMER_GROUP_DETAIL_FIELDS,
    },
    {
      initialData: props.data,
      enabled: Boolean(id),
    }
  )

  if (!customer_group) {
    return null
  }

  return <span>{customer_group.name}</span>
}
