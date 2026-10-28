import { Container, Heading } from "@medusajs/ui"
import {
  MoneyAmountCell,
  StatusCell,
  TextCell,
  TextHeader,
  _DataTable,
  useDataTable,
} from "@mercurjs/dashboard-shared"
import { createColumnHelper } from "@tanstack/react-table"
import { useMemo } from "react"

import {
  ADJUSTMENT_TYPE_LABEL,
  PAYOUT_STATUS_COLOR,
  PAYOUT_STATUS_LABEL,
  statusProps,
  toNumber,
} from "../../../../../../lib/status"

export type SettlementLine = {
  id: string
  amount: unknown
  status: string | null
  reference: string | null
  order_id?: string | null
  order_display_id?: number | null
  type?: string
  reason?: string | null
}

type SettlementLinesSectionProps = {
  title: string
  currencyCode: string
  lines: SettlementLine[]
  emptyMessage: string
  testId: string
}

const columnHelper = createColumnHelper<SettlementLine>()

const useColumns = (currencyCode: string) =>
  useMemo(
    () => [
      columnHelper.accessor("id", {
        header: () => <TextHeader text="Reference" />,
        cell: ({ row }) => {
          const line = row.original
          if (line.order_id) {
            return <TextCell text={`Order #${line.order_display_id ?? line.order_id}`} />
          }
          return <TextCell text={line.type ? ADJUSTMENT_TYPE_LABEL[line.type] ?? line.type : line.id} />
        },
      }),
      columnHelper.accessor((row) => row.reason ?? row.reference ?? "", {
        id: "details",
        header: () => <TextHeader text="Details" />,
        cell: ({ getValue }) => <TextCell text={getValue() || "-"} />,
      }),
      columnHelper.accessor("status", {
        header: () => <TextHeader text="Status" />,
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
        cell: ({ getValue }) => (
          <MoneyAmountCell amount={toNumber(getValue())} currencyCode={currencyCode} align="right" />
        ),
      }),
    ],
    [currencyCode]
  )

export const SettlementLinesSection = ({
  title,
  currencyCode,
  lines,
  emptyMessage,
  testId,
}: SettlementLinesSectionProps) => {
  const columns = useColumns(currencyCode)

  const { table } = useDataTable({
    data: lines,
    columns,
    count: lines.length,
    getRowId: (row) => row.id,
    pageSize: Math.max(lines.length, 1),
  })

  return (
    <Container className="divide-y p-0" data-testid={testId}>
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2" data-testid={`${testId}-heading`}>
          {title}
        </Heading>
      </div>
      <_DataTable
        table={table}
        columns={columns}
        count={lines.length}
        pageSize={Math.max(lines.length, 1)}
        navigateTo={
          lines.every((line) => line.order_id) ? (row) => `/orders/${row.original.order_id}` : undefined
        }
        noRecords={{ message: emptyMessage }}
      />
    </Container>
  )
}
