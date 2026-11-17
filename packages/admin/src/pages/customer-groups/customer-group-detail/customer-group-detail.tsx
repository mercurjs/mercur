import { useLoaderData, useParams } from "react-router-dom"
import { CORE_LAYOUT_IDS } from "@mercurjs/dashboard-sdk"
import {
  LayoutComposer,
  detailPageDefaultEntries,
  useLinkQuery,
} from "@mercurjs/dashboard-shared"

import { useCustomerGroup } from "../../../hooks/api/customer-groups"
import { CustomerGroupCustomerSection } from "./components/customer-group-customer-section"
import { CustomerGroupGeneralSection } from "./components/customer-group-general-section"
import { customerGroupLoader } from "./loader"

import { SingleColumnPageSkeleton } from "../../../components/common/skeleton"
import { CUSTOMER_GROUP_DETAIL_FIELDS } from "./constants"

export const CustomerGroupDetailPage = () => {
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

  return (
    <LayoutComposer
      widgetsZonePrefix="customer-groups.detail"
      preferredLayoutId={CORE_LAYOUT_IDS.SINGLE_COLUMN}
      data={customer_group}
      sections={{
        main: (
          <>
            <LayoutComposer.Entry id="CustomerGroupGeneralSection">
              <CustomerGroupGeneralSection group={customer_group} />
            </LayoutComposer.Entry>
            <LayoutComposer.Entry id="CustomerGroupCustomerSection">
              <CustomerGroupCustomerSection group={customer_group} />
            </LayoutComposer.Entry>
            {detailPageDefaultEntries(customer_group)}
          </>
        ),
      }}
    />
  )
}
