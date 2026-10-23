import { Button, toast } from "@medusajs/ui"
import { DateCell, StatusCell, TextCell, TextHeader } from "@mercurjs/dashboard-shared"
import { createColumnHelper } from "@tanstack/react-table"
import { useMemo } from "react"

import { useCaptureAction, useStripeCaptures } from "../../../../hooks/api/stripe"
import { useActionBlocker } from "../../../../hooks/use-action-blocker"
import type { AdminPayoutCapture } from "../../../../lib/client"
import { formatAmount } from "../../../../lib/status"
import { EntityTable, useListParams } from "./entity-table"
import { JobCard } from "./job-card"

type Row = AdminPayoutCapture & { id: string }
const columnHelper = createColumnHelper<Row>()

export const CapturesTab = () => {
  const { raw, offset, limit } = useListParams()
  const { data, isPending, isError, error } = useStripeCaptures({ offset, limit })
  const action = useCaptureAction()
  const blocker = useActionBlocker("payouts", "edit")

  const rows = useMemo(() => (data?.captures ?? []).map((c) => ({ ...c, id: c.order_group_id })), [data])

  const columns = useMemo(
    () => [
      columnHelper.accessor("order_group_display_id", {
        header: () => <TextHeader text="Order group" />,
        cell: ({ row }) => <TextCell text={row.original.order_group_display_id ? `#${row.original.order_group_display_id}` : row.original.order_group_id} />,
      }),
      columnHelper.accessor("authorized_amount", {
        header: () => <TextHeader text="Authorized" />,
        cell: ({ row }) => <TextCell text={formatAmount(row.original.authorized_amount, row.original.currency_code)} />,
      }),
      columnHelper.accessor("capturable_amount", {
        header: () => <TextHeader text="Capturable" />,
        cell: ({ row }) => <TextCell text={formatAmount(row.original.capturable_amount, row.original.currency_code)} />,
      }),
      columnHelper.accessor("orders_decided", {
        header: () => <TextHeader text="Orders decided" />,
        cell: ({ row }) => <TextCell text={`${row.original.orders_decided} / ${row.original.orders_total}`} />,
      }),
      columnHelper.accessor("expires_at", {
        header: () => <TextHeader text="Authorization expires" />,
        cell: ({ getValue }) => <DateCell date={getValue() ?? null} />,
      }),
      columnHelper.accessor("capture_error", {
        header: () => <TextHeader text="Last error" />,
        cell: ({ getValue }) => (getValue() ? <StatusCell color="red">{getValue()}</StatusCell> : <TextCell text="-" />),
      }),
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => (
          <div className="flex items-center gap-x-2">
            <Button
              size="small"
              variant="secondary"
              disabled={blocker.disabled || Number(row.original.capturable_amount) <= 0}
              onClick={() =>
                action.mutate(
                  { groupId: row.original.order_group_id, action: "capture" },
                  { onSuccess: () => toast.success("Captured"), onError: (e) => toast.error(e.message) }
                )
              }
            >
              Capture now
            </Button>
            <Button
              size="small"
              variant="secondary"
              disabled={blocker.disabled}
              onClick={() =>
                action.mutate(
                  { groupId: row.original.order_group_id, action: "cancel" },
                  { onSuccess: () => toast.success("Canceled"), onError: (e) => toast.error(e.message) }
                )
              }
            >
              Cancel
            </Button>
          </div>
        ),
      }),
    ],
    [action, blocker]
  )

  if (isError) throw error

  return (
    <div className="flex flex-col gap-y-3">
      <JobCard job="payout-validate-captures" />
      <EntityTable
        title="Pending captures"
        subtitle="Authorized card payments waiting for every seller order in the group to be decided."
        rows={rows}
        count={data?.count ?? 0}
        columns={columns as never}
        isLoading={isPending}
        queryObject={raw}
        emptyTitle="Nothing to capture"
        emptyMessage="Every authorized payment has been captured or canceled."
        testId="stripe-captures-table"
      />
    </div>
  )
}
