import { Badge, Container, Heading, StatusBadge, Text, Tooltip } from "@medusajs/ui"
import { SectionRow, Skeleton, useDate } from "@mercurjs/dashboard-shared"

import { useMagentoStatus } from "../../../../hooks/api/magento"
import type { MagentoStatus, MagentoWebhookDeliveryStatus } from "../../../../lib/client"
import { DELIVERY_STATE_COLOR, DELIVERY_STATE_LABEL } from "../lib/delivery-state"

const DELIVERY_STATES: MagentoWebhookDeliveryStatus[] = ["delivered", "failed", "pending", "dead"]

export const MagentoStatusSection = () => {
  const { connection: status, isPending, isError, error } = useMagentoStatus({
    refetchInterval: 30_000,
  })

  if (isError) {
    throw error
  }

  return (
    <Container className="divide-y p-0" data-testid="magento-status-section">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading>Magento</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Connection between this marketplace and your Magento 2 storefront.
          </Text>
        </div>
        <ConnectionBadge status={isPending ? undefined : status} />
      </div>
      {isPending || !status ? <StatusRowsSkeleton /> : <StatusRows status={status} />}
    </Container>
  )
}

const ConnectionBadge = ({ status }: { status?: MagentoStatus }) => {
  if (!status) {
    return <StatusBadge color="grey">Checking</StatusBadge>
  }

  return status.payment_provider.installed && status.webhooks.active > 0 ? (
    <StatusBadge color="green">Connected</StatusBadge>
  ) : (
    <StatusBadge color="orange">Not configured</StatusBadge>
  )
}

const StatusRows = ({ status }: { status: MagentoStatus }) => {
  const { getFullDate, getRelativeDate } = useDate()
  const { deliveries } = status

  const deliveryCounts = DELIVERY_STATES.map((state) => ({
    state,
    count: deliveries[state],
  })).filter(({ state, count }) => count > 0 || state === "delivered")

  return (
    <>
      <SectionRow
        title="Payment provider"
        value={
          status.payment_provider.installed ? (
            <Badge size="2xsmall">{status.payment_provider.id}</Badge>
          ) : (
            <StatusBadge color="red">Not registered</StatusBadge>
          )
        }
      />
      <SectionRow
        title="Webhooks"
        value={`${status.webhooks.active} of ${status.webhooks.total} active`}
      />
      <SectionRow
        title={`Deliveries (last ${deliveries.window_hours}h)`}
        value={deliveryCounts.map(({ state, count }) => (
          <StatusBadge key={state} color={DELIVERY_STATE_COLOR[state]}>
            {count} {DELIVERY_STATE_LABEL[state].toLowerCase()}
          </StatusBadge>
        ))}
      />
      <SectionRow
        title="Last delivery"
        value={
          deliveries.last_delivered_at ? (
            <Tooltip
              content={getFullDate({ date: deliveries.last_delivered_at, includeTime: true })}
            >
              <Text size="small" leading="compact">
                {getRelativeDate(deliveries.last_delivered_at)}
              </Text>
            </Tooltip>
          ) : (
            "Never"
          )
        }
      />
      <SectionRow title="Orders from Magento (24h)" value={String(status.orders.last_24h)} />
    </>
  )
}

const StatusRowsSkeleton = () => (
  <>
    {Array.from({ length: 5 }, (_, i) => (
      <div key={i} className="grid grid-cols-2 items-center gap-4 px-6 py-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-5 w-24" />
      </div>
    ))}
  </>
)
