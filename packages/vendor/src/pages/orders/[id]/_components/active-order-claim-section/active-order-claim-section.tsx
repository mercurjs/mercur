import { ExclamationCircle } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { Button, Container, Heading, Text, toast } from "@medusajs/ui"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"

import { useCancelClaimBegin } from "@hooks/api/claims"

/**
 * Striped banner shown above the order header while a claim draft is
 * in flight. Ported from Medusa admin's `ActiveOrderClaimSection`.
 * Vendor side uses `useCancelClaimBegin` (`DELETE /vendor/claims/:id/
 * request`) which is the route equivalent of admin's
 * `useCancelClaimRequest`.
 */
type ActiveOrderClaimSectionProps = {
  orderPreview: HttpTypes.AdminOrderPreview
}

const readClaimId = (change: unknown): string | undefined => {
  if (
    change &&
    typeof change === "object" &&
    "claim_id" in change &&
    typeof (change as { claim_id?: unknown }).claim_id === "string"
  ) {
    return (change as { claim_id: string }).claim_id
  }
  return undefined
}

export const ActiveOrderClaimSection = ({
  orderPreview,
}: ActiveOrderClaimSectionProps) => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const claimId = readClaimId(orderPreview?.order_change)

  const { mutateAsync: cancelClaim } = useCancelClaimBegin(
    claimId ?? "",
    orderPreview.id
  )

  if (!claimId) {
    return null
  }

  const onContinueClaim = async () => {
    navigate(`/orders/${orderPreview.id}/claims/create`)
  }

  const onCancelClaim = async () => {
    await cancelClaim(undefined, {
      onSuccess: () => {
        toast.success(t("orders.claims.toast.canceledSuccessfully"))
      },
      onError: (error: Error) => {
        toast.error(error.message)
      },
    })
  }

  return (
    <div
      style={{
        background:
          "repeating-linear-gradient(-45deg, rgb(212, 212, 216, 0.15), rgb(212, 212, 216,.15) 10px, transparent 10px, transparent 20px)",
      }}
      className="-m-4 mb-1 border-b border-l p-4"
      data-testid="active-order-claim-section"
    >
      <Container className="flex items-center justify-between p-0">
        <div className="flex w-full flex-row justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 px-6 pt-4">
              <ExclamationCircle className="text-ui-fg-subtle" />
              <Heading level="h2">{t("orders.claims.panel.title")}</Heading>
            </div>

            <div className="gap-2 px-6 pb-4">
              <Text>{t("orders.claims.panel.description")}</Text>
            </div>
          </div>

          <div className="flex items-center justify-end gap-x-2 rounded-b-xl px-4 py-4">
            <Button
              size="small"
              variant="secondary"
              onClick={onCancelClaim}
              data-testid="active-order-claim-cancel"
            >
              {t("orders.claims.cancel.title")}
            </Button>

            <Button
              size="small"
              variant="secondary"
              onClick={onContinueClaim}
              data-testid="active-order-claim-continue"
            >
              {t("actions.continue")}
            </Button>
          </div>
        </div>
      </Container>
    </div>
  )
}
