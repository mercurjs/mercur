import { Container, Heading, StatusBadge, Text } from "@medusajs/ui"
import { PayoutDTO } from "@mercurjs/types"
import { useTranslation } from "react-i18next"
import { getStylizedAmount } from "../../../../lib/money-amount-helpers"

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
  const { t } = useTranslation()

  const statusText =
    payout.status.charAt(0).toUpperCase() + payout.status.slice(1)

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading>#{payout.display_id}</Heading>
        <div className="flex items-center gap-x-2">
          <StatusBadge color={payoutStatusColor(payout.status)}>
            {statusText}
          </StatusBadge>
        </div>
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          {t("fields.amount")}
        </Text>
        <Text size="small" leading="compact">
          {getStylizedAmount(payout.amount as number, payout.currency_code)}
        </Text>
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          {t("fields.createdAt")}
        </Text>
        <Text size="small" leading="compact">
          {new Date(payout.created_at).toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          {t("fields.updatedAt")}
        </Text>
        <Text size="small" leading="compact">
          {new Date(payout.updated_at).toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </div>
    </Container>
  )
}
