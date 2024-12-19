import { OrderAnalyticsChart, OrderTable, useOrders } from '@/entities/order'
import { OrderTableFilters } from '@/features/order-table-filters'
import { Typography } from '@/shared/ui'
import { OrderMetrics } from '@/entities/order'
import { OrderAnalyticsFilter } from '@/features/order-analytics-filter'

export default function OrdersPage() {
  const { orders } = useOrders({
    fields:
      'id,status,created_at,canceled_at,email,display_id,currency_code,total,item_total,shipping_subtotal,subtotal,discount_total,discount_subtotal,shipping_total,shipping_tax_total,tax_total,refundable_total,order_change,*customer,*items,*items.variant,*items.variant.product,*items.variant.options,+items.variant.manage_inventory,*items.variant.inventory_items.inventory,+items.variant.inventory_items.required_quantity,+summary,*shipping_address,*billing_address,*sales_channel,*promotion,*shipping_methods,*fulfillments,*fulfillments.items,*fulfillments.labels,*fulfillments.labels,*payment_collections,*payment_collections.payments,*payment_collections.payments.refunds,*payment_collections.payments.refunds.refund_reason,region.automatic_taxes,*customer'
  })

  return (
    <>
      <div className="flex items-start justify-between">
        <Typography size="2xlarge" weight="plus">
          Orders
        </Typography>
        <OrderAnalyticsFilter />
      </div>
      <OrderAnalyticsChart />
      <OrderMetrics />
      <OrderTableFilters />

      {orders && <OrderTable orders={orders} />}
    </>
  )
}
