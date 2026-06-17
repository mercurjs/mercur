import { ArrowPath } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { Container, Heading } from "@medusajs/ui"
import { keepPreviousData } from "@tanstack/react-query"
import { createColumnHelper } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { ActionMenu } from "../../../../../components/common/action-menu"
import { _DataTable } from "../../../../../components/table/data-table"
import { useOrders } from "../../../../../hooks/api/orders"
import { useOrderTableColumns } from "../../../../../hooks/table/columns/use-order-table-columns"
import { useOrderTableFilters } from "../../../../../hooks/table/filters/use-order-table-filters"
import { useOrderTableQuery } from "../../../../../hooks/table/query/use-order-table-query"
import { useDataTable } from "../../../../../hooks/use-data-table"

const PREFIX = "cusord"
const PAGE_SIZE = 10
const DEFAULT_RELATIONS =
  "*customer,*items,*sales_channel,order_group.id,order_group.display_id,seller.id,seller.name"
const DEFAULT_FIELDS =
  "id,status,display_id,created_at,email,fulfillment_status,payment_status,total,currency_code"

// `order_group` (the multi-vendor parent group) and `seller` (the owning store)
// come from the Mercur `order_group_order` / `order_seller` links and are not on
// Medusa's base order type.
type AdminOrderWithGroup = HttpTypes.AdminOrder & {
  order_group?: { id: string; display_id: number } | null
  seller?: { id: string; name: string } | null
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
  const { orders, count, isLoading, isError, error } = useOrders(
    {
      ...searchParams,
      customer_id: customer.id,
      fields: DEFAULT_FIELDS + "," + DEFAULT_RELATIONS,
    },
    {
      placeholderData: keepPreviousData,
    }
  )

  const columns = useColumns()
  const filters = useOrderTableFilters()

  const { table } = useDataTable({
    data: orders ?? [],
    columns,
    enablePagination: true,
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
        {/*TODO: ENABLE WHEN DRAFT ORDERS ARE DONE*/}
        {/*<div className="flex items-center gap-x-2">*/}
        {/*  <Button size="small" variant="secondary">*/}
        {/*    {t("actions.create")}*/}
        {/*  </Button>*/}
        {/*</div>*/}
      </div>
      <_DataTable
        columns={columns}
        table={table}
        pagination
        navigateTo={(row) => `/orders/${row.original.id}`}
        filters={filters}
        count={count}
        isLoading={isLoading}
        pageSize={PAGE_SIZE}
        orderBy={[
          { key: "display_id", label: t("orders.fields.displayId") },
          { key: "created_at", label: t("fields.createdAt") },
          { key: "updated_at", label: t("fields.updatedAt") },
        ]}
        search={true}
        queryObject={raw}
        prefix={PREFIX}
      />
    </Container>
  )
}

const CustomerOrderActions = ({ order }: { order: HttpTypes.AdminOrder }) => {
  const { t } = useTranslation()

  return (
    <ActionMenu
      data-testid={`customer-order-section-row-actions-${order.id}`}
      groups={[
        {
          actions: [
            {
              label: t("transferOwnership.label"),
              to: `${order.id}/transfer`,
              icon: <ArrowPath />,
            },
          ],
        },
      ]}
    />
  )
}

const columnHelper = createColumnHelper<HttpTypes.AdminOrder>()

const useColumns = () => {
  const { t } = useTranslation()
  const base = useOrderTableColumns({ exclude: ["customer"] })

  return useMemo(
    () => [
      columnHelper.display({
        id: "order_group",
        header: t("orders.fields.groupId"),
        cell: ({ row }) => {
          const orderGroup = (row.original as AdminOrderWithGroup).order_group
          return (
            <span data-testid={`customer-order-group-${row.original.id}`}>
              {orderGroup?.display_id ? `#G${orderGroup.display_id}` : "-"}
            </span>
          )
        },
      }),
      columnHelper.display({
        id: "store",
        header: t("fields.store"),
        cell: ({ row }) => {
          const seller = (row.original as AdminOrderWithGroup).seller
          return (
            <span data-testid={`customer-order-store-${row.original.id}`}>
              {seller?.name ?? "-"}
            </span>
          )
        },
      }),
      ...base,
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => <CustomerOrderActions order={row.original} />,
      }),
    ],
    [base, t]
  )
}
