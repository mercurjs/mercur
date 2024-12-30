import { Paginator, Typography } from '@/shared/ui'

import { createdAtOptionToDate } from '../const'
import { keepPreviousData } from '@tanstack/react-query'
import { useOrdersFilters } from '../lib/use-orders-filters'
import { OrderAnalyticsFilter } from './order-analytics-filter'
import { OrderAnalyticsChart } from './order-anaylytics-chart'
import { OrderMetrics } from './order-metrics'
import { OrderTableFilters } from './order-table-filters'
import { OrdersTable } from './orders-table'
import { useOrders } from '@/shared/hooks/api'

const PAGE_SIZE = 50

export default function OrdersPage() {
  const { createdAt, setCreatedAt, page, setPage, dateRange, setDateRange } =
    useOrdersFilters()

  const currentPage = page ?? 1
  const offset = (currentPage - 1) * PAGE_SIZE

  const { orders, count } = useOrders(
    {
      order: '-created_at',
      limit: PAGE_SIZE,
      // @ts-expect-error: you can not provide object as a value as a query param
      'created_at[$gte]': createdAt
        ? createdAtOptionToDate[createdAt]
        : undefined,
      offset,
      fields:
        'id,status,created_at,canceled_at,email,display_id,currency_code,total,item_total,shipping_subtotal,subtotal,discount_total,discount_subtotal,shipping_total,shipping_tax_total,tax_total,refundable_total,order_change,*customer,*items,*items.variant,*items.variant.product,*items.variant.options,+items.variant.manage_inventory,*items.variant.inventory_items.inventory,+items.variant.inventory_items.required_quantity,+summary,*shipping_address,*billing_address,*sales_channel,*promotion,*shipping_methods,*fulfillments,*fulfillments.items,*fulfillments.labels,*fulfillments.labels,*payment_collections,*payment_collections.payments,*payment_collections.payments.refunds,*payment_collections.payments.refunds.refund_reason,region.automatic_taxes,*customer'
    },
    {
      placeholderData: keepPreviousData
    }
  )

  return (
    <>
      <div className="flex items-start justify-between">
        <Typography size="2xlarge" weight="plus">
          Orders
        </Typography>
        <OrderAnalyticsFilter
          dateRange={dateRange ?? undefined}
          onDateRangeChange={(value) => setDateRange(value ?? null)}
        />
      </div>
      <OrderAnalyticsChart />
      <OrderMetrics />
      <OrderTableFilters
        createdAt={createdAt}
        onCreatedAtChange={setCreatedAt}
      />
      {orders && <OrdersTable orders={orders} />}
      <Paginator
        currentPage={currentPage}
        totalPages={Math.ceil((count ?? 0) / PAGE_SIZE)}
        onPageChange={(page) => (page > 1 ? setPage(page) : setPage(null))}
        showPreviousNext
      />
    </>
  )
}
