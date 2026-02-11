import { Text } from "@medusajs/ui"
import { AdminClaim, AdminReturn } from "@medusajs/types"
import { useTranslation } from "react-i18next"

type ClaimBodyProps = {
  claim: AdminClaim
  claimReturn?: AdminReturn
}

export const ClaimBody = ({
  claim,
  claimReturn,
}: ClaimBodyProps) => {
  const { t } = useTranslation()

  const outboundItems = (claim.additional_items || []).reduce(
    (acc, item) => (acc + item.quantity) as number,
    0
  )

  const inboundItems = (claimReturn?.items || []).reduce(
    (acc, item) => acc + item.quantity,
    0
  )

  return (
    <div>
      {outboundItems > 0 && (
        <Text size="small" className="text-ui-fg-subtle">
          {t("orders.activity.events.claim.itemsInbound", {
            count: outboundItems,
          })}
        </Text>
      )}

      {inboundItems > 0 && (
        <Text size="small" className="text-ui-fg-subtle">
          {t("orders.activity.events.claim.itemsOutbound", {
            count: inboundItems,
          })}
        </Text>
      )}
    </div>
  )
}
