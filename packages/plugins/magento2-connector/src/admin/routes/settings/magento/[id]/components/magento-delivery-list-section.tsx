import { ArrowPath } from "@medusajs/icons"
import { Container, Heading, Text, toast } from "@medusajs/ui"
import {
  ActionMenu,
  DateCell,
  PlaceholderCell,
  StatusCell,
  TextCell,
  TextHeader,
  _DataTable,
  useDataTable,
} from "@mercurjs/dashboard-shared"
import { keepPreviousData } from "@tanstack/react-query"
import { createColumnHelper } from "@tanstack/react-table"
import { useMemo } from "react"

import {
  useMagentoWebhookDeliveries,
  useRedeliverMagentoWebhook,
} from "../../../../../hooks/api/magento"
import { useActionBlocker } from "../../../../../hooks/use-action-blocker"
import type { MagentoWebhookDelivery } from "../../../../../lib/client"
import {
  DELIVERY_STATE_COLOR,
  DELIVERY_STATE_LABEL,
  LIVE_DELIVERY_STATES,
} from "../../lib/delivery-state"

const PAGE_SIZE = 10

export const MagentoDeliveryListSection = ({ webhookId }: { webhookId: string }) => {
  const { deliveries, count, isPending, isError, error } = useMagentoWebhookDeliveries(
    webhookId,
    { limit: PAGE_SIZE },
    {
      placeholderData: keepPreviousData,
      refetchInterval: (query) =>
        query.state.data?.deliveries?.some((d) => LIVE_DELIVERY_STATES.includes(d.status))
          ? 3_000
          : false,
    }
  )

  const { mutateAsync: redeliver } = useRedeliverMagentoWebhook(webhookId, {
    onSuccess: ({ delivery }) =>
      delivery.status === "delivered"
        ? toast.success("Delivered")
        : toast.error(`Delivery failed with status ${delivery.response_status ?? "n/a"}`),
    onError: (e) => toast.error(e.message),
  })

  const data = useMemo(() => deliveries ?? [], [deliveries])
  const columns = useColumns(redeliver)

  const { table } = useDataTable({
    data,
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
    <Container className="divide-y p-0" data-testid="magento-delivery-list-section">
      <div className="px-6 py-4">
        <Heading level="h2">Deliveries</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          Most recent attempts to reach this endpoint.
        </Text>
      </div>
      <_DataTable
        table={table}
        columns={columns}
        count={count ?? 0}
        pageSize={PAGE_SIZE}
        isLoading={isPending}
        pagination
        noRecords={{
          title: "No deliveries yet",
          message: "Deliveries appear here once a subscribed event fires.",
        }}
      />
    </Container>
  )
}

const columnHelper = createColumnHelper<MagentoWebhookDelivery>()

const useColumns = (redeliver: (id: string) => Promise<unknown>) => {
  const redeliverBlocker = useActionBlocker("integrations", "edit")

  return useMemo(
    () => [
      columnHelper.accessor("event", {
        header: () => <TextHeader text="Event" />,
        cell: ({ getValue }) => <TextCell text={getValue()} />,
      }),
      columnHelper.accessor("status", {
        header: () => <TextHeader text="Status" />,
        cell: ({ getValue }) => (
          <StatusCell color={DELIVERY_STATE_COLOR[getValue()]}>
            {DELIVERY_STATE_LABEL[getValue()]}
          </StatusCell>
        ),
      }),
      columnHelper.accessor("response_status", {
        header: () => <TextHeader text="Response" />,
        cell: ({ getValue }) =>
          getValue() === null ? <PlaceholderCell /> : <TextCell text={String(getValue())} />,
      }),
      columnHelper.accessor("attempts", {
        header: () => <TextHeader text="Attempts" />,
        cell: ({ getValue }) => <TextCell text={String(getValue())} />,
      }),
      columnHelper.accessor("next_attempt_at", {
        header: () => <TextHeader text="Next attempt" />,
        cell: ({ getValue }) => {
          const value = getValue()
          return value ? <DateCell date={value} /> : <PlaceholderCell />
        },
      }),
      columnHelper.accessor("created_at", {
        header: () => <TextHeader text="Created" />,
        cell: ({ getValue }) => <DateCell date={getValue()} />,
      }),
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => (
          <ActionMenu
            groups={[
              {
                actions: [
                  {
                    label: "Redeliver",
                    icon: <ArrowPath />,
                    onClick: () => redeliver(row.original.id),
                    ...redeliverBlocker,
                  },
                ],
              },
            ]}
          />
        ),
      }),
    ],
    [redeliver, redeliverBlocker]
  )
}
