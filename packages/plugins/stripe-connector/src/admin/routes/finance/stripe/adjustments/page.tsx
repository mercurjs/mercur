import { Button, Container, Heading, Text } from "@medusajs/ui"
import {
  DateCell,
  MoneyAmountCell,
  SingleColumnPage,
  StatusCell,
  TextCell,
  TextHeader,
  WidgetZone,
  _DataTable,
  PermissionGuard,
  useDataTable,
  type Filter,
} from "@mercurjs/dashboard-shared"
import { defineRouteConfig } from "@mercurjs/dashboard-sdk"
import { keepPreviousData } from "@tanstack/react-query"
import { createColumnHelper } from "@tanstack/react-table"
import { useMemo } from "react"
import { Link } from "react-router-dom"

import { useStripeAccounts, useStripeAdjustments } from "../../../../hooks/api/stripe"
import { PAGE_SIZE, useStripeTableQuery } from "../../../../hooks/use-stripe-table-query"
import type { AdjustmentRow, PayoutAccountRow } from "../../../../lib/client"
import {
  ADJUSTMENT_TYPE_LABEL,
  PAYOUT_STATUS_COLOR,
  PAYOUT_STATUS_LABEL,
  statusProps,
  toNumber,
} from "../../../../lib/status"
import { SettingsProviders } from "../../../../providers/settings-providers"

const AdjustmentListHeader = () => {
  return (
    <div className="flex items-center justify-between px-6 py-4">
      <div>
        <Heading data-testid="stripe-adjustments-heading">Adjustments</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          Fees and credits applied to a store's next settlement.
        </Text>
      </div>
      <PermissionGuard permission="payouts:edit">
        <Button size="small" variant="secondary" asChild data-testid="stripe-adjustment-create-button">
          <Link to="create">Create</Link>
        </Button>
      </PermissionGuard>
    </div>
  )
}

const AdjustmentListDataTable = () => {
  const { searchParams, raw } = useStripeTableQuery({ filters: ["type", "status"] })

  const { adjustments, count, isPending, isError, error } = useStripeAdjustments(searchParams, {
    placeholderData: keepPreviousData,
  })

  const accountIds = useMemo(() => [...new Set((adjustments ?? []).map((a) => a.account_id))], [adjustments])
  const { payout_accounts } = useStripeAccounts(
    { id: accountIds, limit: accountIds.length },
    { enabled: accountIds.length > 0, placeholderData: keepPreviousData }
  )

  const storeNames = useMemo(
    () =>
      new Map(((payout_accounts ?? []) as PayoutAccountRow[]).map((account) => [account.id, account.seller?.name ?? ""])),
    [payout_accounts]
  )

  const columns = useColumns(storeNames)
  const filters = useFilters()

  const { table } = useDataTable({
    data: adjustments ?? [],
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
      noRecords={{ message: "Create an adjustment to charge or credit a store outside of orders." }}
    />
  )
}

const columnHelper = createColumnHelper<AdjustmentRow>()

const useColumns = (storeNames: Map<string, string>) =>
  useMemo(
    () => [
      columnHelper.accessor("created_at", {
        header: () => <TextHeader text="Created" />,
        cell: ({ getValue }) => <DateCell date={getValue()} />,
      }),
      columnHelper.accessor("account_id", {
        header: () => <TextHeader text="Store" />,
        cell: ({ getValue }) => <TextCell text={storeNames.get(getValue()) || "-"} />,
      }),
      columnHelper.accessor("type", {
        header: () => <TextHeader text="Type" />,
        cell: ({ getValue }) => <TextCell text={ADJUSTMENT_TYPE_LABEL[getValue()] ?? getValue()} />,
      }),
      columnHelper.accessor("reason", {
        header: () => <TextHeader text="Reason" />,
        cell: ({ getValue }) => <TextCell text={getValue() ?? "-"} />,
      }),
      columnHelper.accessor("status", {
        header: () => <TextHeader text="Status" />,
        cell: ({ getValue }) => {
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
        cell: ({ row }) => {
          const amount = toNumber(row.original.amount)
          return (
            <MoneyAmountCell
              amount={row.original.type === "extra_credit" ? amount : -amount}
              currencyCode={row.original.currency_code}
              align="right"
            />
          )
        },
      }),
    ],
    [storeNames]
  )

const useFilters = (): Filter[] => [
  {
    key: "type",
    label: "Type",
    type: "select",
    multiple: true,
    options: Object.entries(ADJUSTMENT_TYPE_LABEL).map(([value, label]) => ({ value, label })),
  },
  {
    key: "status",
    label: "Status",
    type: "select",
    multiple: true,
    options: Object.entries(PAYOUT_STATUS_LABEL).map(([value, label]) => ({ value, label })),
  },
]

const AdjustmentListPage = () => (
  <SettingsProviders>
    <SingleColumnPage hasOutlet data-testid="stripe-adjustment-list-page">
      <WidgetZone id="stripe.adjustments.list">
        <Container className="divide-y p-0" data-testid="stripe-adjustment-list-table">
          <AdjustmentListHeader />
          <AdjustmentListDataTable />
        </Container>
      </WidgetZone>
    </SingleColumnPage>
  </SettingsProviders>
)

export const config = defineRouteConfig({
  label: "Adjustments",
  nested: "/finance/stripe",
  rank: 10,
  permissions: ["payouts:view"],
})

export const handle = {
  breadcrumb: () => "Adjustments",
  permissions: "payouts:view",
}

export default AdjustmentListPage
