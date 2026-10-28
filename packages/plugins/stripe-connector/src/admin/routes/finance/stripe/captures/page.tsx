import { CheckCircle, ExclamationCircle, XCircle } from "@medusajs/icons"
import { Container, Heading, Text, Tooltip, toast, usePrompt } from "@medusajs/ui"
import {
  ActionMenu,
  type Filter,
  DateCell,
  MoneyAmountCell,
  SingleColumnPage,
  StatusCell,
  TextCell,
  TextHeader,
  WidgetZone,
  _DataTable,
  getStylizedAmount,
  useDataTable,
} from "@mercurjs/dashboard-shared"
import { defineRouteConfig } from "@mercurjs/dashboard-sdk"
import { keepPreviousData } from "@tanstack/react-query"
import { createColumnHelper } from "@tanstack/react-table"
import { useMemo } from "react"

import { useCancelPayment, useCapturePayment, useStripeCaptures } from "../../../../hooks/api/stripe"
import { PAGE_SIZE, useStripeTableQuery } from "../../../../hooks/use-stripe-table-query"
import type { AdminStripeCapture } from "../../../../lib/client"
import { type BadgeColor, toNumber } from "../../../../lib/status"
import { SettingsProviders } from "../../../../providers/settings-providers"

const CAPTURE_STATUS: Record<AdminStripeCapture["status"], { color: BadgeColor; label: string }> = {
  pending: { color: "grey", label: "Awaiting orders" },
  ready: { color: "blue", label: "Ready to capture" },
  cancelable: { color: "orange", label: "Ready to cancel" },
  captured: { color: "green", label: "Captured" },
  canceled: { color: "grey", label: "Canceled" },
  expired: { color: "red", label: "Expired" },
  failed: { color: "red", label: "Failed" },
}

const SETTLED = ["captured", "canceled"]

const useFilters = (): Filter[] => [
  {
    key: "status",
    label: "Status",
    type: "select",
    multiple: true,
    options: Object.entries(CAPTURE_STATUS).map(([value, { label }]) => ({ value, label })),
  },
  { key: "expires_at", label: "Expires", type: "date" },
]

const CaptureRowActions = ({ capture }: { capture: AdminStripeCapture }) => {
  const prompt = usePrompt()
  const { mutateAsync: captureAsync } = useCapturePayment(capture.order_group_id)
  const { mutateAsync: cancelAsync } = useCancelPayment(capture.order_group_id)

  const amount = getStylizedAmount(toNumber(capture.capturable_amount), capture.currency_code)

  const handleCapture = async () => {
    const confirmed = await prompt({
      title: "Capture payment?",
      description: `${amount} will be captured now, before every order in the group is decided.`,
      confirmText: "Capture",
      cancelText: "Cancel",
    })

    if (!confirmed) {
      return
    }

    await captureAsync(undefined, {
      onSuccess: () => toast.success("Payment captured"),
      onError: (error) => toast.error(error.message),
    })
  }

  const handleCancel = async () => {
    const confirmed = await prompt({
      title: "Cancel authorization?",
      description: `The authorization of ${amount} will be released to the customer. This cannot be undone.`,
      confirmText: "Cancel authorization",
      cancelText: "Keep",
    })

    if (!confirmed) {
      return
    }

    await cancelAsync(undefined, {
      onSuccess: () => toast.success("Authorization canceled"),
      onError: (error) => toast.error(error.message),
    })
  }

  return (
    <ActionMenu
      groups={[
        {
          actions: [
            {
              label: "Capture now",
              icon: <CheckCircle />,
              onClick: handleCapture,
              permission: "payouts:edit",
              disabled: toNumber(capture.capturable_amount) <= 0,
              disabledTooltip: "Nothing left to capture",
            },
          ],
        },
        {
          actions: [
            {
              label: "Cancel authorization",
              icon: <XCircle />,
              onClick: handleCancel,
              permission: "payouts:edit",
            },
          ],
        },
      ]}
    />
  )
}

const columnHelper = createColumnHelper<AdminStripeCapture>()

const useColumns = () =>
  useMemo(
    () => [
      columnHelper.accessor("order_group_id", {
        header: () => <TextHeader text="Order group" />,
        cell: ({ row }) => (
          <TextCell
            text={
              row.original.order_group?.display_id
                ? `#${row.original.order_group.display_id}`
                : row.original.order_group_id
            }
          />
        ),
      }),
      columnHelper.accessor("authorized_at", {
        header: () => <TextHeader text="Authorized" />,
        cell: ({ getValue }) => <DateCell date={getValue() ?? null} />,
      }),
      columnHelper.accessor("expires_at", {
        header: () => <TextHeader text="Expires" />,
        cell: ({ getValue }) => <DateCell date={getValue() ?? null} />,
      }),
      columnHelper.accessor("orders_decided", {
        header: () => <TextHeader text="Orders decided" />,
        cell: ({ row }) => <TextCell text={`${row.original.orders_decided} of ${row.original.orders_total}`} />,
      }),
      columnHelper.accessor("status", {
        header: () => <TextHeader text="Status" />,
        cell: ({ row }) => {
          const { color, label } = CAPTURE_STATUS[row.original.status]
          return (
            <div className="flex h-full w-full items-center gap-x-2">
              <StatusCell color={color}>{label}</StatusCell>
              {row.original.status_reason && (
                <Tooltip content={row.original.status_reason}>
                  <ExclamationCircle className="text-ui-tag-orange-icon shrink-0" />
                </Tooltip>
              )}
            </div>
          )
        },
      }),
      columnHelper.accessor("capturable_amount", {
        header: () => (
          <div className="flex h-full w-full items-center justify-end">
            <span className="truncate">Capturable</span>
          </div>
        ),
        cell: ({ row }) => (
          <MoneyAmountCell
            amount={toNumber(row.original.capturable_amount)}
            currencyCode={row.original.currency_code}
            align="right"
          />
        ),
      }),
      columnHelper.display({
        id: "actions",
        cell: ({ row }) =>
          SETTLED.includes(row.original.status) ? null : <CaptureRowActions capture={row.original} />,
      }),
    ],
    []
  )

const CaptureListDataTable = () => {
  const { searchParams, raw } = useStripeTableQuery({ filters: ["status"], dateFilters: ["expires_at"] })
  const { captures, count, isPending, isError, error } = useStripeCaptures(searchParams, {
    placeholderData: keepPreviousData,
  })

  const columns = useColumns()
  const filters = useFilters()

  const { table } = useDataTable({
    data: captures ?? [],
    columns,
    count: count ?? 0,
    enablePagination: true,
    getRowId: (row) => row.order_group_id,
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
      isLoading={isPending}
      queryObject={raw}
      filters={filters}
      pagination
      noRecords={{ message: "Every authorized payment has been captured or canceled." }}
    />
  )
}

const CaptureListPage = () => (
  <SettingsProviders>
    <SingleColumnPage data-testid="stripe-capture-list-page">
      <WidgetZone id="stripe.captures.list">
        <Container className="divide-y p-0" data-testid="stripe-capture-list-table">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <Heading data-testid="stripe-captures-heading">Captures</Heading>
              <Text size="small" className="text-ui-fg-subtle">
                Card payments authorized at checkout and captured once every order in the group is decided.
              </Text>
            </div>
          </div>
          <CaptureListDataTable />
        </Container>
      </WidgetZone>
    </SingleColumnPage>
  </SettingsProviders>
)

export const config = defineRouteConfig({
  label: "Captures",
  nested: "/finance/stripe",
  rank: 20,
  permissions: ["payouts:view"],
})

export const handle = {
  breadcrumb: () => "Captures",
  permissions: "payouts:view",
}

export default CaptureListPage
