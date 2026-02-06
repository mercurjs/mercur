// Route: /customer-groups/:id
import { HttpTypes } from "@medusajs/types"
import { UIMatch, useLoaderData, useParams, LoaderFunctionArgs } from "react-router-dom"

import { SingleColumnPageSkeleton } from "@components/common/skeleton"
import { SingleColumnPage } from "@components/layout/pages"
import { useDashboardExtension } from "@/extensions"
import { useCustomerGroup } from "@hooks/api/customer-groups"
import { productsQueryKeys } from "@hooks/api/products"
import { fetchQuery } from "@lib/client"
import { queryClient } from "@lib/query-client"

import { CustomerGroupCustomerSection } from "./_components/customer-group-customer-section"
import { CustomerGroupGeneralSection } from "./_components/customer-group-general-section"
import { CUSTOMER_GROUP_DETAIL_FIELDS } from "./constants"

// Loader
const customerGroupDetailQuery = (id: string) => ({
  queryKey: productsQueryKeys.detail(id),
  queryFn: async () =>
    fetchQuery(`/vendor/customer-groups/${id}`, {
      method: "GET",
      query: { fields: CUSTOMER_GROUP_DETAIL_FIELDS },
    }),
})

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id
  const query = customerGroupDetailQuery(id!)
  return queryClient.ensureQueryData(query)
}

// Breadcrumb
type CustomerGroupDetailBreadcrumbProps = UIMatch<HttpTypes.AdminCustomerGroupResponse>

export const Breadcrumb = (props: CustomerGroupDetailBreadcrumbProps) => {
  const { id } = props.params || {}
  const { customer_group } = useCustomerGroup(id!, { fields: CUSTOMER_GROUP_DETAIL_FIELDS }, { initialData: props.data, enabled: Boolean(id) })

  if (!customer_group) return null
  return <span>{customer_group.name}</span>
}

// Main component
export const Component = () => {
  const initialData = useLoaderData() as Awaited<ReturnType<typeof loader>>
  const { id } = useParams()
  const { customer_group, isLoading, isError, error } = useCustomerGroup(id!, { fields: CUSTOMER_GROUP_DETAIL_FIELDS }, { initialData })
  const { getWidgets } = useDashboardExtension()

  if (isLoading || !customer_group) return <SingleColumnPageSkeleton sections={2} />
  if (isError) throw error

  return (
    <SingleColumnPage
      widgets={{
        before: getWidgets("customer_group.details.before"),
        after: getWidgets("customer_group.details.after"),
      }}
      data={customer_group}
    >
      <CustomerGroupGeneralSection group={customer_group} />
      <CustomerGroupCustomerSection group={customer_group} />
    </SingleColumnPage>
  )
}
