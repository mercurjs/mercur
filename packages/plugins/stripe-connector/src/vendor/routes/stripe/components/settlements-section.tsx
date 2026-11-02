import { Container, Heading, Text } from "@medusajs/ui"
import {
  DateCell,
  MoneyAmountCell,
  StatusCell,
  TextCell,
  TextHeader,
  _DataTable,
  useDataTable,
  useQueryParams,
  type Filter,
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
const SELECT_FILTERS = ["status", "payout_status"] as const
const DATE_FILTERS = ["period_end"] as const

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

const columnHelper = createColumnHelper<VendorSettlementRow>()

const useColumns = () =>
  useMemo(
    () => [
      columnHelper.accessor("display_id", {
        header: () => <TextHeader text="Settlement" />,
        cell: ({ getValue }) => <TextCell text={`#${getValue()}`} />,
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
            <TextCell text="-" />
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

export const SettlementsSection = () => {
  const raw = useQueryParams(["offset", ...SELECT_FILTERS, ...DATE_FILTERS], PREFIX)

  const query: Record<string, unknown> & { limit: number; offset: number } = {
    limit: PAGE_SIZE,
    offset: raw.offset ? Number(raw.offset) : 0,
  }

  // The client serializes `undefined` as a literal string, so only set what is present.
  for (const key of SELECT_FILTERS) {
    if (raw[key]) {
      query[key] = raw[key].split(",")
    }
  }

  for (const key of DATE_FILTERS) {
    if (raw[key]) {
      query[key] = JSON.parse(raw[key])
    }
  }

  const { settlements, count, isPending, isError, error } = useMySettlements(query, {
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
    prefix: PREFIX,
  })

  if (isError) {
    throw error
  }

  return (
    <Container className="divide-y p-0" data-testid="stripe-settlements-section">
      <div className="px-6 py-4">
        <Heading level="h2" data-testid="stripe-settlements-heading">
          Settlements
        </Heading>
        <Text size="small" leading="compact" className="text-ui-fg-subtle">
          Your payouts and refunds netted per period, and the bank payout that paid them.
        </Text>
      </div>
      <_DataTable
        table={table}
        columns={columns}
        count={count ?? 0}
        pageSize={PAGE_SIZE}
        isLoading={isPending}
        queryObject={raw}
        filters={filters}
        prefix={PREFIX}
        pagination
        noRecords={{ message: "Settlements appear once your first payouts are settled." }}
      />
    </Container>
  )
}
