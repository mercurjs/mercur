import { useLoaderData, useParams } from "react-router-dom"
import { HttpTypes } from "@medusajs/types"
import { UIMatch } from "react-router-dom"

import { TwoColumnPageSkeleton } from "@components/common/skeleton"
import { TwoColumnPage } from "@components/layout/pages"
import { useOrder, useOrderPreview } from "@hooks/api/orders"
import { usePlugins } from "@hooks/api/plugins"
import { useExtension } from "@providers/extension-provider"
import { ActiveOrderClaimSection } from "./_components/active-order-claim-section"
import { ActiveOrderExchangeSection } from "./_components/active-order-exchange-section"
import { ActiveOrderReturnSection } from "./_components/active-order-return-section"
import { OrderActiveEditSection } from "./_components/order-active-edit-section"
import { OrderActivitySection } from "./_components/order-activity-section"
import { OrderCustomerSection } from "./_components/order-customer-section"
import { OrderFulfillmentSection } from "./_components/order-fulfillment-section"
import { OrderGeneralSection } from "./_components/order-general-section"
import { OrderPaymentSection } from "./_components/order-payment-section"
import { OrderSummarySection } from "./_components/order-summary-section"
import { OrderRemainingOrdersGroupSection } from "./_components/order-remaining-orders-group-section"
import { DEFAULT_FIELDS } from "./constants"
import { orderLoader } from "./loader"

export const Component = () => {
  const initialData = useLoaderData() as Awaited<
    ReturnType<typeof orderLoader>
  >

  const { id } = useParams()
  const { getWidgets } = useExtension()
  const { plugins = [] } = usePlugins()

  const { order, isLoading, isError, error } = useOrder(
    id!,
    {
      fields: DEFAULT_FIELDS,
    },
    {
      initialData,
    }
  )

  // TODO: Retrieve endpoints don't have an order ability, so a JS sort until this is available
  if (order) {
    order.items = order.items.sort((itemA, itemB) => {
      if (itemA.created_at > itemB.created_at) {
        return 1
      }

      if (itemA.created_at < itemB.created_at) {
        return -1
      }

      return 0
    })
  }

  const { order: orderPreview, isLoading: isPreviewLoading } = useOrderPreview(
    id!
  )

  if (isLoading || !order || isPreviewLoading) {
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
      showJSON
      showMetadata
      hasOutlet
      data-testid="order-detail-page"
    >
      <TwoColumnPage.Main data-testid="order-detail-main">
        <OrderActiveEditSection order={order} />
        <ActiveOrderClaimSection orderPreview={orderPreview!} />
        <ActiveOrderExchangeSection orderPreview={orderPreview!} />
        <ActiveOrderReturnSection orderPreview={orderPreview!} />
        <OrderGeneralSection order={order} />
        <OrderSummarySection order={order} plugins={plugins} />
        <OrderPaymentSection order={order} plugins={plugins} />
        <OrderFulfillmentSection order={order} />
      </TwoColumnPage.Main>
      <TwoColumnPage.Sidebar data-testid="order-detail-sidebar">
        <OrderCustomerSection order={order} />
        <OrderActivitySection order={order} />
        <OrderRemainingOrdersGroupSection />
      </TwoColumnPage.Sidebar>
    </TwoColumnPage>
  )
}

export const loader = orderLoader

type OrderDetailBreadcrumbProps = UIMatch<HttpTypes.AdminOrderResponse>

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
