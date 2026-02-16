import { Container, Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

import { _DataTable } from "@components/table/data-table/data-table"
import { usePayouts } from "@hooks/api/payouts"
import { usePayoutTableColumns } from "@hooks/table/columns/use-payout-table-columns"
import { usePayoutTableQuery } from "@hooks/table/query/use-payout-table-query"
import { useDataTable } from "@hooks/use-data-table"
import { usePayoutTableFilters } from "@hooks/table/filters/use-payout-table-filters"

const PAGE_SIZE = 10

export const PayoutListTable = () => {
  const { t } = useTranslation()
  const { raw, searchParams } = usePayoutTableQuery({
    pageSize: PAGE_SIZE,
  })

  const { payouts, count, isError, error, isLoading } =
    usePayouts(searchParams)

  const columns = usePayoutTableColumns()
  const filters = usePayoutTableFilters()

  const { table } = useDataTable({
    data: payouts ?? [],
    columns,
    enablePagination: true,
    count: count,
    pageSize: PAGE_SIZE,
  })

  if (isError) {
    throw error
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading>Payouts</Heading>
      </div>
      <_DataTable
        columns={columns}
        table={table}
        pagination
        filters={filters}
        navigateTo={(row) => `/payouts/${row.original.id}`}
        count={count}
        isLoading={isLoading}
        pageSize={PAGE_SIZE}
        orderBy={[
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
          message: "No payouts found",
        }}
      />
    </Container>
  )
}
