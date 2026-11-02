import { CurrencyDollar } from "@medusajs/icons"
import { Container, Heading } from "@medusajs/ui"
import { keepPreviousData } from "@tanstack/react-query"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { _DataTable } from "../../../../components/table/data-table"
import { usePayouts } from "../../../../hooks/api/payouts"
import { usePayoutTableColumns } from "../../../../hooks/table/columns/use-payout-table-columns"
import { usePayoutTableFilters } from "../../../../hooks/table/filters/use-payout-table-filters"
import { usePayoutTableQuery } from "../../../../hooks/table/query/use-payout-table-query"
import { useDataTable } from "../../../../hooks/use-data-table"

const PAGE_SIZE = 10

type PayoutsSectionProps = {
  /** Narrows the payouts to one payout account or one store; the Store column and filter drop out. */
  scope: { account_id: string } | { seller_id: string }
  prefix: string
  "data-testid"?: string
}

export const PayoutsSection = ({
  scope,
  prefix,
  "data-testid": testId = "payouts-section",
}: PayoutsSectionProps) => {
  const { t } = useTranslation()

  const { searchParams, raw } = usePayoutTableQuery({
    prefix,
    pageSize: PAGE_SIZE,
  })

  const { payouts, count, isError, error, isLoading } = usePayouts(
    { ...searchParams, ...scope },
    { placeholderData: keepPreviousData }
  )

  const base = usePayoutTableColumns()
  const columns = useMemo(
    () => base.filter((column) => column.id !== "store"),
    [base]
  )
  const filters = usePayoutTableFilters().filter(
    (filter) => filter.key !== "seller_id"
  )

  const { table } = useDataTable({
    data: payouts ?? [],
    columns,
    enablePagination: true,
    getRowId: (row) => row.id,
    count: count ?? 0,
    pageSize: PAGE_SIZE,
    prefix,
  })

  if (isError) {
    throw error
  }

  return (
    <Container className="divide-y p-0" data-testid={testId}>
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2" data-testid={`${testId}-heading`}>
          {t("payouts.domain")}
        </Heading>
      </div>
      <_DataTable
        columns={columns}
        table={table}
        pagination
        navigateTo={(row) => `/payouts/${row.original.id}`}
        count={count ?? 0}
        filters={filters}
        isLoading={isLoading}
        pageSize={PAGE_SIZE}
        orderBy={[
          { key: "status", label: t("fields.status") },
          { key: "amount", label: t("fields.amount") },
          { key: "created_at", label: t("fields.createdAt") },
        ]}
        defaultOrder="-created_at"
        queryObject={raw}
        prefix={prefix}
        noRecords={{
          message: t("payouts.list.empty"),
          icon: <CurrencyDollar className="text-ui-fg-subtle" />,
        }}
      />
    </Container>
  )
}
