import { ExclamationCircle } from "@medusajs/icons"
import { Button, Container, Heading, Text, toast } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

import { useNavigate } from "react-router-dom"
import { useCancelClaimRequest } from "../../../../../hooks/api/claims"
import { useOrderDetailContext } from "../../context"

export const ActiveOrderClaimSection = () => {
  const { orderPreview } = useOrderDetailContext()
  const claimId = orderPreview?.order_change?.claim_id

  if (!claimId) {
    return null
  }

  return <ClaimActions claimId={claimId} orderId={orderPreview.id} />
}

const ClaimActions = ({ claimId, orderId }: { claimId: string; orderId: string }) => {
  const { t } = useTranslation()
  const { mutateAsync: cancelClaim } = useCancelClaimRequest(claimId, orderId)
  const navigate = useNavigate()

  const onContinueClaim = async () => {
    navigate(`/orders/${orderId}/claims`)
  }

  const onCancelClaim = async () => {
    await cancelClaim(undefined, {
      onSuccess: () => {
        toast.success(t("orders.claims.toast.canceledSuccessfully"))
      },
      onError: (error) => {
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
            <div className="mb-2 flex items-center gap-2 px-6 pt-4" data-testid="active-order-claim-header">
              <ExclamationCircle className="text-ui-fg-subtle" />
              <Heading level="h2" data-testid="active-order-claim-heading">{t("orders.claims.panel.title")}</Heading>
            </div>

            <div className="gap-2 px-6 pb-4" data-testid="active-order-claim-description">
              <Text>{t("orders.claims.panel.description")}</Text>
            </div>
          </div>

          <div className="flex items-center justify-end gap-x-2 rounded-b-xl px-4 py-4" data-testid="active-order-claim-actions">
            <Button size="small" variant="secondary" onClick={onCancelClaim} data-testid="active-order-claim-cancel-button">
              {t("orders.claims.cancel.title")}
            </Button>

            <Button size="small" variant="secondary" onClick={onContinueClaim} data-testid="active-order-claim-continue-button">
              {t("actions.continue")}
            </Button>
          </div>
        </div>
      </Container>
    </div>
  )
}
