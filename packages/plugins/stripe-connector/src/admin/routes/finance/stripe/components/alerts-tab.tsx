import { Button, Container, Heading, Text, toast } from "@medusajs/ui"
import { DateCell, StatusCell, TextCell, TextHeader } from "@mercurjs/dashboard-shared"
import { createColumnHelper } from "@tanstack/react-table"
import { useMemo } from "react"

import { useSendTestNotification, useStripeNotifications, useStripeStatus } from "../../../../hooks/api/stripe"
import { useActionBlocker } from "../../../../hooks/use-action-blocker"
import type { NotificationRow } from "../../../../lib/client"
import { EntityTable, useListParams } from "./entity-table"
import { JobCard } from "./job-card"

const columnHelper = createColumnHelper<NotificationRow>()

export const AlertsTab = () => {
  const { raw, offset, limit } = useListParams()
  const status = useStripeStatus()
  const notifications = useStripeNotifications({ offset, limit })
  const test = useSendTestNotification()
  const blocker = useActionBlocker("payouts", "edit")

  const columns = useMemo(
    () => [
      columnHelper.accessor("created_at", { header: () => <TextHeader text="Sent" />, cell: ({ getValue }) => <DateCell date={getValue()} /> }),
      columnHelper.accessor("type", { header: () => <TextHeader text="Type" />, cell: ({ getValue }) => <TextCell text={getValue()} /> }),
      columnHelper.accessor("url", { header: () => <TextHeader text="URL" />, cell: ({ getValue }) => <TextCell text={getValue()} /> }),
      columnHelper.accessor("attempts", { header: () => <TextHeader text="Attempts" />, cell: ({ getValue }) => <TextCell text={String(getValue())} /> }),
      columnHelper.accessor("delivered", {
        header: () => <TextHeader text="Result" />,
        cell: ({ row }) =>
          row.original.delivered ? (
            <StatusCell color="green">{String(row.original.response_status ?? "ok")}</StatusCell>
          ) : (
            <StatusCell color="red">{row.original.error ?? row.original.response_status ?? "failed"}</StatusCell>
          ),
      }),
    ],
    []
  )

  const failed = status.data?.failed
  const options = status.data?.options as { notifications?: { url?: string }; alerting?: { technicalEmail?: string } } | undefined

  return (
    <div className="flex flex-col gap-y-3">
      <JobCard job="payout-alert-failed-operations" />
      <Container className="divide-y p-0" data-testid="stripe-alerts-summary">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <Heading>Still failed</Heading>
            <Text size="small" className="text-ui-fg-subtle">
              What the next digest email to {options?.alerting?.technicalEmail ?? "the technical contact"} will list.
            </Text>
          </div>
          <Button
            size="small"
            variant="secondary"
            isLoading={test.isPending}
            disabled={blocker.disabled || !options?.notifications?.url}
            onClick={() =>
              test.mutate(undefined, {
                onSuccess: () => toast.success("Test notification sent"),
                onError: (e) => toast.error(e.message),
              })
            }
          >
            Send test notification
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-4 px-6 py-4 md:grid-cols-4">
          {[
            ["Captures", failed?.captures ?? 0],
            ["Payouts", failed?.payouts ?? 0],
            ["Reversals", failed?.reversals ?? 0],
            ["Settlements", failed?.settlements ?? 0],
            ["Adjustments", failed?.adjustments ?? 0],
          ].map(([label, value]) => (
            <div key={label as string} className="flex flex-col">
              <Text size="xsmall" className="text-ui-fg-subtle">
                {label}
              </Text>
              <Text size="large" weight="plus" className={Number(value) > 0 ? "text-ui-fg-error" : ""}>
                {value}
              </Text>
            </div>
          ))}
        </div>
      </Container>
      <EntityTable
        title="Operator notifications"
        subtitle={options?.notifications?.url ? `POSTed to ${options.notifications.url}` : "No notification URL configured."}
        rows={(notifications.data?.notifications ?? []) as NotificationRow[]}
        count={notifications.data?.count ?? 0}
        columns={columns as never}
        isLoading={notifications.isPending}
        queryObject={raw}
        emptyTitle="No notifications sent"
        emptyMessage="A notification goes out the moment a payout, reversal or settlement fails."
        testId="stripe-notifications-table"
      />
    </div>
  )
}
