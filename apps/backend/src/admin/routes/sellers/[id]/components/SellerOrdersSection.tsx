import { Container, Divider, Heading } from "@medusajs/ui";
import { DataTable } from "../../../../components/table/data-table";
import { createColumnHelper } from "@tanstack/react-table"
import { useDataTable } from "../../../../hooks/table/use-data-table";
import { useMemo } from "react";
import { formatDate } from "../../../../lib/date";
import { getStylizedAmount, useSellerOrdersTableQuery } from "../../helpers";
import { PaymentStatusBadge } from "../../../../components/payments-status-badge/payment-status-badge";
import { OrderStatusBadge } from "../../../../components/order-status-badge/order-status-badge";

const PAGE_SIZE = 10

export const SellerOrdersSection = ({orders}: {orders: any}) => {

    const { raw } = useSellerOrdersTableQuery({
        pageSize: PAGE_SIZE,
        offset: 0,
      })

    const columns = useColumns()

    const { table } = useDataTable({
        data: orders,
        columns,
        count: orders?.length || 0,
        enablePagination: true,
        pageSize: PAGE_SIZE,
        getRowId: (row:any) => row?.id || "",
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
          count={orders?.length || 0}
          pageSize={10}
          isLoading={false}
          queryObject={raw}  
          search
          pagination
          navigateTo={(row) => `/sellers/${row.id}`}
          orderBy={[
            { key: "display_id", label: "Order" },
            { key: "created_at", label: "Created" },
            { key: "updated_at", label: "Updated" },
          ]}
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
            cell: ({ row }) => formatDate(row.original.created_at)
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
            cell: ({ row }) => <PaymentStatusBadge status={row.original.status} />
          }),
          columnHelper.display({
            id: 'fulfillment_status',
            header: 'Fulfillment Status',
            cell: ({ row }) => <PaymentStatusBadge status={row.original.status} />
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