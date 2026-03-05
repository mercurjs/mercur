import { Container, Heading, Text } from "@medusajs/ui"
import { keepPreviousData } from "@tanstack/react-query"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { _DataTable } from "../../../../components/table/data-table"
import { useOrders } from "../../../../hooks/api/orders"
import { useOrderTableColumns } from "../../../../hooks/table/columns/use-order-table-columns"
import { useOrderTableFilters } from "../../../../hooks/table/filters"
import { useOrderTableQuery } from "../../../../hooks/table/query"
import { useDataTable } from "../../../../hooks/use-data-table"

const PAGE_SIZE = 10
const PREFIX = "selord"
const DEFAULT_RELATIONS = "*customer,*items,*sales_channel"
const DEFAULT_FIELDS =
  "id,status,display_id,created_at,email,fulfillment_status,payment_status,total,currency_code"

export const SellerOrderSection = ({ sellerId }: { sellerId: string }) => {
  const { t } = useTranslation()

  const { searchParams, raw } = useOrderTableQuery({
    pageSize: PAGE_SIZE,
    prefix: PREFIX,
  })

  const { orders, count, isLoading, isError } = useOrders(
    {
      ...searchParams,
      seller_id: sellerId,
      fields: DEFAULT_FIELDS + "," + DEFAULT_RELATIONS,
    },
    {
      placeholderData: keepPreviousData,
    },
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
    return (
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <Heading level="h2">{t("orders.domain")}</Heading>
        </div>
        <div className="flex items-center justify-center px-6 py-12">
          <Text size="small" className="text-ui-fg-muted">
            {t("general.error")}
          </Text>
        </div>
      </Container>
    )
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{t("orders.domain")}</Heading>
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
        search
        queryObject={raw}
        prefix={PREFIX}
      />
    </Container>
  )
}

const useColumns = () => {
  const base = useOrderTableColumns({ exclude: ["customer"] })

  return useMemo(
    () => [...base],
    [base],
  )
}
