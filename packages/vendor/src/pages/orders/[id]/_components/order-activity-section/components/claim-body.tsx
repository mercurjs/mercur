import { Button, Text, usePrompt } from "@medusajs/ui"
import { AdminClaim, AdminReturn } from "@medusajs/types"
import { useTranslation } from "react-i18next"
import { useCancelClaim } from "@hooks/api/claims"

type ClaimBodyProps = {
  claim: AdminClaim
  claimReturn?: AdminReturn
}

export const ClaimBody = ({
  claim,
  claimReturn,
}: ClaimBodyProps) => {
  const prompt = usePrompt()
  const { t } = useTranslation()

  const isCanceled = !!claim.created_at

  const { mutateAsync: cancelClaim } = useCancelClaim(claim.id, claim.order_id)

  const onCancel = async () => {
    const res = await prompt({
      title: t("orders.claims.cancel.title"),
      description: t("orders.claims.cancel.description"),
      confirmText: t("actions.confirm"),
      cancelText: t("actions.cancel"),
    })

    if (!res) {
      return
    }

    await cancelClaim()
  }

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

      {!isCanceled && (
        <Button
          onClick={onCancel}
          className="text-ui-fg-subtle h-auto px-0 leading-none hover:bg-transparent"
          variant="transparent"
          size="small"
        >
          {t("actions.cancel")}
        </Button>
      )}
    </div>
  )
}

