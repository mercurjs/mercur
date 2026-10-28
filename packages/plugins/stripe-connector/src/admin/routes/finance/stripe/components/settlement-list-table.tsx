import { Container, Heading, Text } from "@medusajs/ui"
import {
  DateCell,
  MoneyAmountCell,
  StatusCell,
  TextCell,
  TextHeader,
  _DataTable,
  useDataTable,
  type Filter,
} from "@mercurjs/dashboard-shared"
import { keepPreviousData } from "@tanstack/react-query"
import { createColumnHelper } from "@tanstack/react-table"
import { useMemo } from "react"

import { useStripeSettlements } from "../../../../hooks/api/stripe"
import { PAGE_SIZE, useStripeTableQuery } from "../../../../hooks/use-stripe-table-query"
import type { SettlementRow } from "../../../../lib/client"
import {
  PAYOUT_STATUS_COLOR,
  PAYOUT_STATUS_LABEL,
  SETTLEMENT_STATUS_COLOR,
  SETTLEMENT_STATUS_LABEL,
  statusProps,
  toNumber,
} from "../../../../lib/status"

export const SettlementListTable = () => (
  <Container className="divide-y p-0" data-testid="stripe-settlement-list-table">
    <div className="flex items-center justify-between px-6 py-4">
      <div>
        <Heading data-testid="stripe-settlements-heading">Settlements</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          Payouts, reversals and adjustments netted per store and paid to its bank account.
        </Text>
      </div>
    </div>
    <SettlementListDataTable />
  </Container>
)

const SettlementListDataTable = () => {
  const { searchParams, raw } = useStripeTableQuery({
    filters: ["status", "payout_status"],
    dateFilters: ["period_end"],
  })

  const { settlements, count, isPending, isError, error } = useStripeSettlements(searchParams, {
    placeholderData: keepPreviousData,
  })

  const columns = useColumns()
  const filters = useFilters()

  const { table } = useDataTable({
    data: settlements ?? [],
    columns,
    count: count ?? 0,
    enablePagination: true,
    getRowId: (row) => row.id,
    pageSize: PAGE_SIZE,
  })

  if (isError) {
    throw error
  }

  return (
    <_DataTable
      table={table}
      columns={columns}
      count={count ?? 0}
      pageSize={PAGE_SIZE}
      filters={filters}
      isLoading={isPending}
      queryObject={raw}
      pagination
      navigateTo={(row) => `/finance/stripe/settlements/${row.original.id}`}
      noRecords={{ message: "Settlements are built nightly from the payouts that landed." }}
    />
  )
}

const columnHelper = createColumnHelper<SettlementRow>()

const useColumns = () =>
  useMemo(
    () => [
      columnHelper.accessor("display_id", {
        header: () => <TextHeader text="Settlement" />,
        cell: ({ getValue }) => <TextCell text={`#${getValue()}`} />,
      }),
      columnHelper.accessor("period_end", {
        header: () => <TextHeader text="Period end" />,
        cell: ({ getValue }) => <DateCell date={getValue()} />,
      }),
      columnHelper.accessor((row) => row.payout_account?.seller?.name ?? "", {
        id: "seller",
        header: () => <TextHeader text="Store" />,
        cell: ({ getValue }) => <TextCell text={getValue() || "-"} />,
      }),
      columnHelper.accessor("status", {
        header: () => <TextHeader text="Status" />,
        cell: ({ getValue }) => {
          const { color, label } = statusProps(getValue(), SETTLEMENT_STATUS_COLOR, SETTLEMENT_STATUS_LABEL)
          return <StatusCell color={color}>{label}</StatusCell>
        },
      }),
      columnHelper.accessor("payout_status", {
        header: () => <TextHeader text="Bank payout" />,
        cell: ({ getValue }) => {
          if (!getValue()) {
            return <TextCell text="-" />
          }
          const { color, label } = statusProps(getValue(), PAYOUT_STATUS_COLOR, PAYOUT_STATUS_LABEL)
          return <StatusCell color={color}>{label}</StatusCell>
        },
      }),
      columnHelper.accessor("amount", {
        header: () => (
          <div className="flex h-full w-full items-center justify-end">
            <span className="truncate">Amount</span>
          </div>
        ),
        cell: ({ row }) => (
          <MoneyAmountCell amount={toNumber(row.original.amount)} currencyCode={row.original.currency_code} align="right" />
        ),
      }),
    ],
    []
  )

const useFilters = (): Filter[] => [
  {
    key: "status",
    label: "Status",
    type: "select",
    multiple: true,
    options: Object.entries(SETTLEMENT_STATUS_LABEL).map(([value, label]) => ({ value, label })),
  },
  {
    key: "payout_status",
    label: "Bank payout",
    type: "select",
    multiple: true,
    options: Object.entries(PAYOUT_STATUS_LABEL).map(([value, label]) => ({ value, label })),
  },
  { key: "period_end", label: "Period end", type: "date" },
]
