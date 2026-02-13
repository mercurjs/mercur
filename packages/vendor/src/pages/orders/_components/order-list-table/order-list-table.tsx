import { Container, Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

import { _DataTable } from "@components/table/data-table/data-table"
import { useOrders } from "@hooks/api/orders"
import { useOrderTableColumns } from "@hooks/table/columns/use-order-table-columns"
import { useOrderTableQuery } from "@hooks/table/query/use-order-table-query"
import { useDataTable } from "@hooks/use-data-table"
import { useSearchParams } from "react-router-dom"
import { useOrderTableFilters } from "@hooks/table/filters"

const PAGE_SIZE = 10

export const OrderListTable = () => {
  const { t } = useTranslation()
  const { raw, searchParams } = useOrderTableQuery({
    pageSize: PAGE_SIZE,
  })

  const [params] = useSearchParams()
  const order_status = params.get("order_status") || ""

  const { orders, count, isError, error, isLoading } = useOrders(
    {
      fields: "*customer,+payment_status,*payment_collections",
    },
    undefined,
    {
      order_status,
      created_at: searchParams.created_at,
      updated_at: searchParams.updated_at,
      sort: searchParams.order,
    }
  )

  const offset = searchParams.offset || 0

  const processedOrders = orders?.slice(offset, offset + PAGE_SIZE)
  const processedCount = count < orders?.length ? count : orders?.length || 0

  const columns = useOrderTableColumns({})
  const filters = useOrderTableFilters()

  const { table } = useDataTable({
    data: processedOrders ?? [],
    columns,
    enablePagination: true,
    count: processedCount,
    pageSize: PAGE_SIZE,
  })

  if (isError) {
    throw error
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading>{t("orders.domain")}</Heading>
      </div>
      <_DataTable
        columns={columns}
        table={table}
        pagination
        filters={filters}
        navigateTo={(row) => `/orders/${row.original.id}`}
        count={processedCount}
        isLoading={isLoading}
        pageSize={PAGE_SIZE}
        orderBy={[
          {
            key: "display_id",
            label: t("orders.fields.displayId"),
          },
          {
            key: "created_at",
            label: t("fields.createdAt"),
          },
          {
            key: "updated_at",
            label: t("fields.updatedAt"),
          },
        ]}
        queryObject={raw}
        noRecords={{
          message: t("orders.list.noRecordsMessage"),
        }}
      />
    </Container>
  )
}
