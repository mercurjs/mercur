import { Container, Heading } from "@medusajs/ui"
import { keepPreviousData } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"

import { _DataTable } from "../../../components/table/data-table"
import { usePayouts } from "../../../hooks/api/payouts"
import { usePayoutTableColumns } from "../../../hooks/table/columns/use-payout-table-columns"
import { usePayoutTableQuery } from "../../../hooks/table/query/use-payout-table-query"
import { useDataTable } from "../../../hooks/use-data-table"

const PAGE_SIZE = 10

export const PayoutList = () => {
  const { t } = useTranslation()

  const { searchParams, raw } = usePayoutTableQuery({
    pageSize: PAGE_SIZE,
  })

  const { payouts, count, isError, error, isLoading } = usePayouts(
    searchParams,
    {
      placeholderData: keepPreviousData,
    },
  )

  const columns = usePayoutTableColumns()

  const { table } = useDataTable({
    data: payouts ?? [],
    columns,
    enablePagination: true,
    count: count ?? 0,
    pageSize: PAGE_SIZE,
  })

  if (isError) {
    throw error
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Payouts</Heading>
      </div>
      <_DataTable
        columns={columns}
        table={table}
        pagination
        navigateTo={(row) => `/payouts/${row.original.id}`}
        count={count ?? 0}
        search
        isLoading={isLoading}
        pageSize={PAGE_SIZE}
        orderBy={[
          { key: "created_at", label: t("fields.createdAt") },
          { key: "updated_at", label: t("fields.updatedAt") },
        ]}
        queryObject={raw}
        noRecords={{
          message: "No payouts found",
        }}
      />
    </Container>
  )
}
