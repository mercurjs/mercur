import { Container, StatusBadge, Text } from "@medusajs/ui"
import { PayoutDTO } from "@mercurjs/types"
import { getStylizedAmount } from "@lib/money-amount-helpers"

const payoutStatusColor = (status: string) => {
  switch (status) {
    case "paid":
      return "green"
    case "processing":
      return "orange"
    case "pending":
      return "grey"
    case "failed":
    case "canceled":
      return "red"
    default:
      return "grey"
  }
}

export const PayoutGeneralSection = ({ payout }: { payout: PayoutDTO }) => {
  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Text size="large" leading="compact" weight="plus">
          Payout Details
        </Text>
        <StatusBadge color={payoutStatusColor(payout.status)}>
          {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
        </StatusBadge>
      </div>
      <div className="grid grid-cols-2 gap-4 px-6 py-4">
        <div>
          <Text size="small" leading="compact" weight="plus">
            ID
          </Text>
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            {payout.id}
          </Text>
        </div>
        <div>
          <Text size="small" leading="compact" weight="plus">
            Amount
          </Text>
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            {getStylizedAmount(payout.amount as number, payout.currency_code)}
          </Text>
        </div>
        <div>
          <Text size="small" leading="compact" weight="plus">
            Currency
          </Text>
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            {payout.currency_code.toUpperCase()}
          </Text>
        </div>
        <div>
          <Text size="small" leading="compact" weight="plus">
            Created At
          </Text>
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            {new Date(payout.created_at).toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </div>
        <div>
          <Text size="small" leading="compact" weight="plus">
            Updated At
          </Text>
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            {new Date(payout.updated_at).toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </div>
      </div>
    </Container>
  )
}
