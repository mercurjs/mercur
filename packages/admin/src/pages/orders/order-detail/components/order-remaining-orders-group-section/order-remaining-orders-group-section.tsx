import { HttpTypes } from "@medusajs/types"
import { Container, Heading } from "@medusajs/ui"
import { createColumnHelper } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"

import { _DataTable } from "@components/table/data-table"
import {
  DateCell,
  DateHeader,
} from "@components/table/table-cells/common/date-cell"
import {
  TextCell,
  TextHeader,
} from "@components/table/table-cells/common/text-cell"
import {
  DisplayIdCell,
  DisplayIdHeader,
} from "@components/table/table-cells/order/display-id-cell"
import {
  FulfillmentStatusCell,
  FulfillmentStatusHeader,
} from "@components/table/table-cells/order/fulfillment-status-cell"
import {
  PaymentStatusCell,
  PaymentStatusHeader,
} from "@components/table/table-cells/order/payment-status-cell"
import {
  TotalCell,
  TotalHeader,
} from "@components/table/table-cells/order/total-cell"
import { useOrderGroupByOrderId } from "@hooks/api/order-groups"
import { useDataTable } from "@hooks/use-data-table"

const DEFAULT_FIELDS =
  "id,*orders,*orders.customer,*orders.seller,*orders.sales_channel"

export const OrderRemainingOrdersGroupSection = () => {
  const { id } = useParams()
  const { t } = useTranslation()

  const { order_group, isLoading, isError, error } = useOrderGroupByOrderId(
    id!,
    { fields: DEFAULT_FIELDS }
  )

  const orders = useMemo(() => {
    const group = order_group as any
    if (!group?.orders) return []
    return group.orders.filter((o: any) => o.id !== id)
  }, [order_group, id])

  const columns = useColumns()

  const { table } = useDataTable({
    data: orders as HttpTypes.AdminOrder[],
    columns,
    count: orders.length,
    enablePagination: true,
    pageSize: Math.max(orders.length, 1),
    getRowId: (row) => row.id,
  })

  if (isError) {
    throw error
  }

  if (!isLoading && orders.length === 0) {
    return null
  }

  return (
    <Container
      className="divide-y p-0"
      data-testid="order-remaining-orders-group-section"
    >
      <div
        className="flex items-center justify-between px-6 py-4"
        data-testid="order-remaining-orders-group-header"
      >
        <Heading level="h2" data-testid="order-remaining-orders-group-heading">
          {t("orders.domain")} in group
        </Heading>
      </div>
      <_DataTable
        columns={columns}
        table={table}
        navigateTo={(row) => `/orders/${row.original.id}`}
        count={orders.length}
        isLoading={isLoading}
        pageSize={orders.length}
        noRecords={{
          message: "No other orders in this group",
        }}
      />
    </Container>
  )
}

const columnHelper = createColumnHelper<HttpTypes.AdminOrder>()

const useColumns = () => {
  return useMemo(
    () => [
      columnHelper.accessor("display_id", {
        header: () => <DisplayIdHeader />,
        cell: ({ getValue }) => <DisplayIdCell displayId={getValue()!} />,
      }),
      columnHelper.display({
        id: "seller",
        header: () => <TextHeader text="Seller" />,
        cell: ({ row }) => {
          const seller = (row.original as any).seller
          return <TextCell text={seller?.name ?? "-"} />
        },
      }),
      columnHelper.accessor("created_at", {
        header: () => <DateHeader />,
        cell: ({ getValue }) => <DateCell date={new Date(getValue())} />,
      }),
      columnHelper.accessor("payment_status", {
        header: () => <PaymentStatusHeader />,
        cell: ({ getValue }) => <PaymentStatusCell status={getValue()} />,
      }),
      columnHelper.accessor("fulfillment_status", {
        header: () => <FulfillmentStatusHeader />,
        cell: ({ getValue }) => <FulfillmentStatusCell status={getValue()} />,
      }),
      columnHelper.accessor("total", {
        header: () => <TotalHeader />,
        cell: ({ getValue, row }) => (
          <TotalCell
            currencyCode={row.original.currency_code}
            total={getValue()}
          />
        ),
      }),
    ],
    []
  )
}
