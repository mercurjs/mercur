// Route: /orders/:id
import { UIMatch, useLoaderData, useParams, LoaderFunctionArgs } from "react-router-dom"

import { TwoColumnPageSkeleton } from "@components/common/skeleton"
import { TwoColumnPage } from "@components/layout/pages"
import { useDashboardExtension } from "@/extensions"
import { useOrder } from "@hooks/api/orders"
import { ordersQueryKeys } from "@hooks/api/orders"
import { fetchQuery } from "@lib/client"
import { queryClient } from "@lib/query-client"
import { ExtendedAdminOrderResponse } from "@custom-types/order"

import { OrderCustomerSection } from "./_components/order-customer-section"
import { OrderFulfillmentSection } from "./_components/order-fulfillment-section"
import { OrderGeneralSection } from "./_components/order-general-section"
import { OrderPaymentSection } from "./_components/order-payment-section"
import { OrderSummarySection } from "./_components/order-summary-section"
import { DEFAULT_FIELDS } from "./constants"

// Loader
const orderDetailQuery = (id: string) => ({
  queryKey: ordersQueryKeys.detail(id),
  queryFn: async () =>
    fetchQuery(`/vendor/orders/${id}`, {
      method: "GET",
      query: { fields: DEFAULT_FIELDS },
    }),
})

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id
  const query = orderDetailQuery(id!)

  return queryClient.ensureQueryData(query)
}

// Breadcrumb
type OrderDetailBreadcrumbProps = UIMatch<ExtendedAdminOrderResponse>

export const Breadcrumb = (props: OrderDetailBreadcrumbProps) => {
  const { id } = props.params || {}

  const { order } = useOrder(
    id!,
    {
      fields: DEFAULT_FIELDS,
    },
    {
      initialData: props.data,
      enabled: Boolean(id),
    }
  )

  if (!order) {
    return null
  }

  return <span>#{order.display_id}</span>
}

// Main component
export const Component = () => {
  const initialData = useLoaderData() as Awaited<ReturnType<typeof loader>>

  const { id } = useParams()
  const { getWidgets } = useDashboardExtension()

  const { order, isLoading, isError, error } = useOrder(
    id!,
    {
      fields: DEFAULT_FIELDS,
    },
    {
      initialData,
    }
  )

  if (order) {
    order.items = order.items.sort((itemA: any, itemB: any) => {
      if (itemA.created_at > itemB.created_at) {
        return 1
      }

      if (itemA.created_at < itemB.created_at) {
        return -1
      }

      return 0
    })
  }

  if (isLoading || !order) {
    return (
      <TwoColumnPageSkeleton mainSections={4} sidebarSections={2} showJSON />
    )
  }

  if (isError) {
    throw error
  }

  return (
    <TwoColumnPage
      widgets={{
        after: getWidgets("order.details.after"),
        before: getWidgets("order.details.before"),
        sideAfter: getWidgets("order.details.side.after"),
        sideBefore: getWidgets("order.details.side.before"),
      }}
      data={order}
      hasOutlet
    >
      <TwoColumnPage.Main>
        <OrderGeneralSection order={order} />
        <OrderSummarySection order={order} />
        <OrderPaymentSection order={order} />
        <OrderFulfillmentSection order={order} />
      </TwoColumnPage.Main>
      <TwoColumnPage.Sidebar>
        <OrderCustomerSection order={order} />
      </TwoColumnPage.Sidebar>
    </TwoColumnPage>
  )
}
