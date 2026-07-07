import { ArrowPath, TriangleRightMini } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { OrderGroupDTO } from "@mercurjs/types"
import { Container, Heading, IconButton, clx } from "@medusajs/ui"
import { keepPreviousData } from "@tanstack/react-query"
import { createColumnHelper } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { DisplayExtensionZone } from "@mercurjs/dashboard-shared"
import { ActionMenu } from "../../../../../components/common/action-menu"
import { _DataTable } from "../../../../../components/table/data-table"
import {
  DateCell,
  DateHeader,
} from "../../../../../components/table/table-cells/common/date-cell"
import {
  TextCell,
  TextHeader,
} from "../../../../../components/table/table-cells/common/text-cell"
import {
  FulfillmentStatusCell,
  FulfillmentStatusHeader,
} from "../../../../../components/table/table-cells/order/fulfillment-status-cell"
import {
  PaymentStatusCell,
  PaymentStatusHeader,
} from "../../../../../components/table/table-cells/order/payment-status-cell"
import { useOrderGroups } from "../../../../../hooks/api/order-groups"
import { useOrderTableQuery } from "../../../../../hooks/table/query/use-order-table-query"
import { useDataTable } from "../../../../../hooks/use-data-table"
import { useOrderGroupTableFilters } from "../../../../orders/order-list/components/order-list-table/use-order-table-filters"
import { getStylizedAmount } from "../../../../../lib/money-amount-helpers"

const PREFIX = "cusord"
const PAGE_SIZE = 10

// Order groups (the multi-vendor parent) carry the customer's per-seller child
// orders. Mirrors the admin order list so the customer detail shows the same
// expandable Group ID rows.
const DEFAULT_FIELDS = [
  "id",
  "display_id",
  "customer_id",
  "seller_count",
  "total",
  "created_at",
  "updated_at",
  "orders.id",
  "orders.display_id",
  "orders.created_at",
  "orders.updated_at",
  "orders.payment_status",
  "orders.fulfillment_status",
  "orders.total",
  "orders.currency_code",
  "*orders.seller",
].join(",")

// Flattened table row built from `OrderGroupDTO` (group rows) and their child
// orders. `id` / `created_at` / `updated_at` come straight from the DTO;
// `display_id` is rendered (`#G12` for groups, `#34` for orders) so it's a
// string here rather than the numeric `OrderGroupDTO.display_id`, and the
// store / status / total fields are pulled from the child order.
type OrderGroupRow = Pick<OrderGroupDTO, "id" | "created_at" | "updated_at"> & {
  _type: "group" | "order"
  display_id: string
  order_ids: string
  store: string
  payment_status: string | null
  fulfillment_status: string | null
  total: number | null
  currency_code: string
  children: OrderGroupRow[]
}

function transformOrderGroups(
  orderGroups: any[],
  t: (key: string, options?: Record<string, unknown>) => string
): OrderGroupRow[] {
  return orderGroups.map((group) => {
    const orders = group.orders ?? []
    const orderIds = orders.map((o: any) => `#${o.display_id}`).join(", ")
    const currencyCode = orders[0]?.currency_code ?? "usd"

    const children: OrderGroupRow[] = orders.map((order: any) => ({
      _type: "order" as const,
      id: order.id,
      display_id: `#${order.display_id}`,
      order_ids: "",
      store: order.seller?.name ?? "-",
      created_at: new Date(order.created_at),
      updated_at: new Date(order.updated_at),
      payment_status: order.payment_status ?? null,
      fulfillment_status: order.fulfillment_status ?? null,
      total: order.total ?? null,
      currency_code: order.currency_code ?? "usd",
      children: [],
    }))

    return {
      _type: "group" as const,
      id: group.id,
      display_id: `#G${group.display_id}`,
      order_ids: orderIds,
      store: t("orders.fields.vendorsCount", { count: group.seller_count }),
      created_at: new Date(group.created_at),
      updated_at: new Date(group.updated_at),
      payment_status: null,
      fulfillment_status: null,
      total: group.total ?? null,
      currency_code: currencyCode,
      children,
    }
  })
}

export const CustomerOrderSection = ({
  customer,
}: {
  customer: HttpTypes.AdminCustomer
}) => {
  const { t } = useTranslation()

  const { searchParams, raw } = useOrderTableQuery({
    pageSize: PAGE_SIZE,
    prefix: PREFIX,
  })

  const { order_groups, count, isLoading, isError, error } = useOrderGroups(
    {
      ...searchParams,
      customer_id: customer.id,
      fields: DEFAULT_FIELDS,
    },
    {
      placeholderData: keepPreviousData,
    }
  )

  const rows = useMemo(
    () => transformOrderGroups(order_groups ?? [], t),
    [order_groups, t]
  )

  // Orders are already scoped to this customer, so the customer filter is dropped.
  const filters = useOrderGroupTableFilters().filter(
    (f) => f.key !== "customer_id"
  )
  const columns = useColumns()

  const { table } = useDataTable({
    data: rows,
    columns,
    enablePagination: true,
    enableExpandableRows: true,
    getSubRows: (row) => row.children,
    getRowId: (row) => row.id,
    count,
    pageSize: PAGE_SIZE,
    prefix: PREFIX,
  })

  if (isError) {
    throw error
  }

  return (
    <Container className="divide-y p-0" data-testid="customer-order-section">
      <div className="flex items-center justify-between px-6 py-4" data-testid="customer-order-section-header">
        <Heading level="h2" data-testid="customer-order-section-heading">{t("orders.domain")}</Heading>
      </div>
      <_DataTable
        columns={columns}
        table={table}
        pagination
        navigateTo={(row) =>
          row.original._type === "order" ? `/orders/${row.original.id}` : ""
        }
        onRowClick={(row) => {
          if (row.getCanExpand()) {
            row.toggleExpanded()
          }
        }}
        count={count}
        isLoading={isLoading}
        pageSize={PAGE_SIZE}
        filters={filters}
        orderBy={[
          { key: "display_id", label: t("orders.fields.displayId") },
          { key: "created_at", label: t("fields.createdAt") },
          { key: "updated_at", label: t("fields.updatedAt") },
        ]}
        defaultOrder="-display_id"
        search={true}
        queryObject={raw}
        prefix={PREFIX}
      />
      <DisplayExtensionZone model="customer" zone="orders" data={customer} />
    </Container>
  )
}

const CustomerOrderActions = ({ orderId }: { orderId: string }) => {
  const { t } = useTranslation()

  return (
    <ActionMenu
      data-testid={`customer-order-section-row-actions-${orderId}`}
      groups={[
        {
          actions: [
            {
              label: t("transferOwnership.label"),
              to: `${orderId}/transfer`,
              icon: <ArrowPath />,
            },
          ],
        },
      ]}
    />
  )
}

const columnHelper = createColumnHelper<OrderGroupRow>()

const useColumns = () => {
  const { t } = useTranslation()

  return useMemo(
    () => [
      columnHelper.accessor("display_id", {
        header: () => <TextHeader text={t("orders.fields.groupId")} />,
        cell: ({ row, getValue }) => {
          if (row.original._type === "order") {
            return null
          }

          const expandHandler = row.getToggleExpandedHandler()

          return (
            <div className="flex size-full items-center gap-x-2 overflow-hidden">
              <div className="flex size-7 items-center justify-center">
                {row.getCanExpand() ? (
                  <IconButton
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      e.preventDefault()
                      expandHandler()
                    }}
                    size="small"
                    variant="transparent"
                    className="text-ui-fg-subtle"
                    data-testid={`customer-order-group-expand-${row.original.id}`}
                  >
                    <TriangleRightMini
                      className={clx({
                        "rotate-90 transition-transform will-change-transform":
                          row.getIsExpanded(),
                      })}
                    />
                  </IconButton>
                ) : null}
              </div>
              <span className="truncate">{getValue()}</span>
            </div>
          )
        },
      }),
      columnHelper.accessor("order_ids", {
        header: () => <TextHeader text={t("orders.fields.orderIds")} />,
        cell: ({ row, getValue }) => {
          if (row.original._type === "group") {
            return <TextCell text={getValue()} />
          }
          return <TextCell text={row.original.display_id} />
        },
      }),
      columnHelper.accessor("store", {
        header: () => <TextHeader text={t("fields.store")} />,
        cell: ({ getValue }) => <TextCell text={getValue()} />,
      }),
      columnHelper.accessor("created_at", {
        header: () => <DateHeader />,
        cell: ({ getValue }) => <DateCell date={getValue()} />,
      }),
      columnHelper.accessor("payment_status", {
        header: () => <PaymentStatusHeader />,
        cell: ({ row, getValue }) => {
          if (row.original._type === "group") {
            return null
          }
          const status = getValue()
          if (!status) {
            return "-"
          }
          return <PaymentStatusCell status={status as never} />
        },
      }),
      columnHelper.accessor("fulfillment_status", {
        header: () => <FulfillmentStatusHeader />,
        cell: ({ row, getValue }) => {
          if (row.original._type === "group") {
            return null
          }
          const status = getValue()
          if (!status) {
            return "-"
          }
          return <FulfillmentStatusCell status={status as never} />
        },
      }),
      columnHelper.accessor("total", {
        header: () => <TextHeader text={t("fields.total")} />,
        cell: ({ row, getValue }) => {
          const total = getValue()
          if (total == null) {
            return "-"
          }
          return (
            <TextCell
              text={getStylizedAmount(total, row.original.currency_code)}
            />
          )
        },
      }),
      columnHelper.display({
        id: "actions",
        cell: ({ row }) =>
          row.original._type === "order" ? (
            <CustomerOrderActions orderId={row.original.id} />
          ) : null,
      }),
    ],
    [t]
  )
}
