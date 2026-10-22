import { Container, Heading, StatusBadge, Text } from "@medusajs/ui"
import { SectionRow } from "@mercurjs/dashboard-shared"

import { useMagentoStatus } from "../../../../hooks/api/magento"

const formatDate = (value: string | null) =>
  value ? new Date(value).toLocaleString() : "Never"

export const MagentoStatusSection = () => {
  const { connection: status, isPending, isError, error } = useMagentoStatus({
    refetchInterval: 30_000,
  })

  if (isError) {
    throw error
  }

  const connected =
    !!status?.payment_provider.installed && (status?.webhooks.active ?? 0) > 0

  return (
    <Container className="divide-y p-0" data-testid="magento-status-section">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading>Magento</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Connection between this marketplace and your Magento 2 storefront.
          </Text>
        </div>
        {isPending || !status ? (
          <StatusBadge color="grey">Checking</StatusBadge>
        ) : connected ? (
          <StatusBadge color="green">Connected</StatusBadge>
        ) : (
          <StatusBadge color="orange">Not configured</StatusBadge>
        )}
      </div>
      <SectionRow
        title="Payment provider"
        value={
          status ? (
            status.payment_provider.installed ? (
              <StatusBadge color="green">{status.payment_provider.id}</StatusBadge>
            ) : (
              <StatusBadge color="red">Missing from payment module</StatusBadge>
            )
          ) : (
            "-"
          )
        }
      />
      <SectionRow
        title="Webhooks"
        value={status ? `${status.webhooks.active} active of ${status.webhooks.total}` : "-"}
      />
      <SectionRow
        title={`Deliveries (last ${status?.deliveries.window_hours ?? 24}h)`}
        value={
          status
            ? [
                `${status.deliveries.delivered} delivered`,
                status.deliveries.failed ? `${status.deliveries.failed} retrying` : null,
                status.deliveries.dead ? `${status.deliveries.dead} gave up` : null,
                status.deliveries.pending ? `${status.deliveries.pending} queued` : null,
              ]
                .filter(Boolean)
                .join(" · ")
            : "-"
        }
      />
      <SectionRow
        title="Last delivery"
        value={status ? formatDate(status.deliveries.last_delivered_at) : "-"}
      />
      <SectionRow
        title="Orders from Magento (24h)"
        value={status ? String(status.orders.last_24h) : "-"}
      />
    </Container>
  )
}
