// Route: /customer-groups/:id
import { HttpTypes } from "@medusajs/types"
import { UIMatch, useParams } from "react-router-dom"

import { SingleColumnPageSkeleton } from "@components/common/skeleton"
import { SingleColumnPage } from "@components/layout/pages"
import { useDashboardExtension } from "@/extensions"
import { useCustomerGroup } from "@hooks/api/customer-groups"

import { CustomerGroupCustomerSection } from "./_components/customer-group-customer-section"
import { CustomerGroupGeneralSection } from "./_components/customer-group-general-section"
import { CUSTOMER_GROUP_DETAIL_FIELDS } from "./constants"

// Breadcrumb
type CustomerGroupDetailBreadcrumbProps = UIMatch<HttpTypes.AdminCustomerGroupResponse>

export const Breadcrumb = (props: CustomerGroupDetailBreadcrumbProps) => {
  const { id } = props.params || {}
  const { customer_group } = useCustomerGroup(id!, { fields: CUSTOMER_GROUP_DETAIL_FIELDS }, { enabled: Boolean(id) })

  if (!customer_group) return null
  return <span>{customer_group.name}</span>
}

// Main component
export const Component = () => {
  const { id } = useParams()
  const { customer_group, isLoading } = useCustomerGroup(id!, { fields: CUSTOMER_GROUP_DETAIL_FIELDS })
  const { getWidgets } = useDashboardExtension()

  if (isLoading || !customer_group) return <SingleColumnPageSkeleton sections={2} />

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
