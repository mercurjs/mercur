import { Container, Divider, Heading } from "@medusajs/ui";
import { DataTable } from "../../../../components/table/data-table";
import { createColumnHelper } from "@tanstack/react-table"
import { useDataTable } from "../../../../hooks/table/use-data-table";
import { useMemo } from "react";
import { formatDate } from "../../../../lib/date";
import { getStylizedAmount, useSellerOrdersTableQuery } from "../../helpers";
import { PaymentStatusBadge } from "../../../../components/payments-status-badge/payment-status-badge";
import { OrderStatusBadge } from "../../../../components/order-status-badge/order-status-badge";
import { FulfillmentStatusBadge } from "../../../../components/fulfillmen t-status-badge/fulfillment-status-badge";
import { useOrderTableFilters } from "../../helpers/user-order-table-filters";

const PAGE_SIZE = 10
const PREFIX = 'so'

export const SellerOrdersSection = ({ seller_orders }: { seller_orders: any }) => {
  const { orders, count } = seller_orders

  const { raw } = useSellerOrdersTableQuery({
    pageSize: PAGE_SIZE,
    prefix: PREFIX,
    offset: 0,
  })

  const columns = useColumns()
  const filters = useOrderTableFilters()

  const { table } = useDataTable({
    data: orders,
    columns,
    count,
    enablePagination: true,
    pageSize: PAGE_SIZE,
    getRowId: (row: any) => row?.id || "",
    prefix: PREFIX,
  })

  return (
    <Container className="mt-2 px-0">
      <div className="px-8 pb-4">
        <Heading>Orders</Heading>
      </div>
      <Divider />
      <DataTable
        table={table}
        columns={columns}
        count={count}
        filters={filters}
        pageSize={PAGE_SIZE}
        isLoading={false}
        queryObject={raw}
        search
        pagination
        navigateTo={(row) => `/orders/${row.id}`}
        orderBy={[
          { key: "display_id", label: "Order" },
          { key: "created_at", label: "Created" },
          { key: "updated_at", label: "Updated" },
        ]}
        prefix={PREFIX}
      />
    </Container>
  )
}

const columnHelper = createColumnHelper<any>()

const useColumns = () => {
  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'display_id',
        header: 'Order',
        cell: ({ row }) => `#${row.original.display_id}`
      }),
      columnHelper.display({
        id: 'created_at',
        header: 'Date',
        cell: ({ row }) => formatDate(row.original.created_at, 'MMM d, yyyy')
      }),
      columnHelper.display({
        id: 'customer',
        header: 'Customer',
        cell: ({ row }) => {
          return row.original.customer?.first_name && row.original.customer?.last_name ? `${row.original.customer?.first_name} ${row.original.customer?.last_name}` : row.original.customer?.email
        }
      }),
      columnHelper.display({
        id: 'status',
        header: 'Order Status',
        cell: ({ row }) => <OrderStatusBadge status={row.original.status} />
      }),
      columnHelper.display({
        id: 'payment_status',
        header: 'Payment Status',
        cell: ({ row }) => <PaymentStatusBadge status={row.original?.payment_status || '-'} />
      }),
      columnHelper.display({
        id: 'fulfillment_status',
        header: 'Fulfillment Status',
        cell: ({ row }) => <FulfillmentStatusBadge status={row.original.fulfillment_status || '-'} />
      }),
      columnHelper.display({
        id: 'total',
        header: 'Order Total',
        cell: ({ row }) => {
          if (typeof row.original.total === "undefined" || row.original.total === null) {
            return '-'
          }

          const formatted = getStylizedAmount(row.original.total, row.original.currency_code)
          return (
            <div
              className="flex h-full w-full items-center overflow-hidden justify-start text-left"
            >
              <span className="truncate">{formatted}</span>
            </div>
          )
        }
      }),
    ],
    []
  )

  return columns
}