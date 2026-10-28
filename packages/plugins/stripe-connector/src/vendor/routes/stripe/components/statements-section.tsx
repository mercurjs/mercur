import { Container, Heading, Text } from "@medusajs/ui"
import {
  DateCell,
  MoneyAmountCell,
  StatusCell,
  TextHeader,
  _DataTable,
  useDataTable,
  useQueryParams,
} from "@mercurjs/dashboard-shared"
import { keepPreviousData } from "@tanstack/react-query"
import { createColumnHelper } from "@tanstack/react-table"
import { useMemo } from "react"

import { useMySettlements } from "../../../hooks/api/stripe"
import type { VendorSettlementRow } from "../../../lib/client"
import {
  PAYOUT_STATUS_COLOR,
  PAYOUT_STATUS_LABEL,
  SETTLEMENT_STATUS_COLOR,
  SETTLEMENT_STATUS_LABEL,
} from "../../../lib/status"

const PAGE_SIZE = 10
const PREFIX = "stmt"

const columnHelper = createColumnHelper<VendorSettlementRow>()

const useColumns = () =>
  useMemo(
    () => [
      columnHelper.accessor("display_id", {
        header: () => <TextHeader text="Statement" />,
        cell: ({ getValue }) => <span className="txt-compact-small">#{getValue()}</span>,
      }),
      columnHelper.accessor("period_start", {
        header: () => <TextHeader text="From" />,
        cell: ({ getValue }) => <DateCell date={getValue()} />,
      }),
      columnHelper.accessor("period_end", {
        header: () => <TextHeader text="To" />,
        cell: ({ getValue }) => <DateCell date={getValue()} />,
      }),
      columnHelper.accessor("status", {
        header: () => <TextHeader text="Status" />,
        cell: ({ getValue }) => (
          <StatusCell color={SETTLEMENT_STATUS_COLOR[getValue()] ?? "grey"}>
            {SETTLEMENT_STATUS_LABEL[getValue()] ?? getValue()}
          </StatusCell>
        ),
      }),
      columnHelper.accessor("payout_status", {
        header: () => <TextHeader text="Bank payout" />,
        cell: ({ getValue }) => {
          const status = getValue()
          return status ? (
            <StatusCell color={PAYOUT_STATUS_COLOR[status] ?? "grey"}>{PAYOUT_STATUS_LABEL[status] ?? status}</StatusCell>
          ) : (
            <span className="txt-compact-small text-ui-fg-muted">-</span>
          )
        },
      }),
      columnHelper.accessor("amount", {
        header: () => (
          <div className="flex h-full w-full items-center justify-end">
            <span className="truncate">Amount</span>
          </div>
        ),
        cell: ({ row }) => (
          <MoneyAmountCell amount={Number(row.original.amount)} currencyCode={row.original.currency_code} align="right" />
        ),
      }),
    ],
    []
  )

export const StatementsSection = () => {
  const raw = useQueryParams(["offset"], PREFIX)
  const query = { limit: PAGE_SIZE, offset: raw.offset ? Number(raw.offset) : 0 }

  const { data, isPending, isError, error } = useMySettlements(query, { placeholderData: keepPreviousData })
  const columns = useColumns()

  const { table } = useDataTable({
    data: data?.settlements ?? [],
    columns,
    count: data?.count ?? 0,
    enablePagination: true,
    getRowId: (row) => row.id,
    pageSize: PAGE_SIZE,
    prefix: PREFIX,
  })

  if (isError) {
    throw error
  }

  return (
    <Container className="divide-y p-0" data-testid="stripe-statements-section">
      <div className="px-6 py-4">
        <Heading level="h2">Statements</Heading>
        <Text size="small" leading="compact" className="text-ui-fg-subtle">
          Your payouts and refunds netted per period, and the bank payout that paid them.
        </Text>
      </div>
      <_DataTable
        table={table}
        columns={columns}
        count={data?.count ?? 0}
        pageSize={PAGE_SIZE}
        isLoading={isPending}
        queryObject={raw}
        prefix={PREFIX}
        pagination
        noRecords={{ message: "Statements appear once your first payouts are settled." }}
      />
    </Container>
  )
}
