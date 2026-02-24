import { ArrowUturnLeft } from "@medusajs/icons"
import { Button, Container, Heading, Text, toast } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

import { HttpTypes } from "@medusajs/types"
import { useNavigate } from "react-router-dom"
import { useCancelReturnRequest } from "../../../../../hooks/api/returns"

type ActiveOrderReturnSectionProps = {
  orderPreview: HttpTypes.AdminOrderPreview
}

export const ActiveOrderReturnSection = ({
  orderPreview,
}: ActiveOrderReturnSectionProps) => {
  const { t } = useTranslation()
  const orderChange = orderPreview?.order_change
  const returnId = orderChange?.return_id
  const isReturnRequest =
    orderChange?.change_type === "return_request" && !!orderChange.return_id

  const { mutateAsync: cancelReturn } = useCancelReturnRequest(
    returnId,
    orderPreview.id
  )

  const navigate = useNavigate()

  const onContinueReturn = async () => {
    navigate(`/orders/${orderPreview.id}/returns`)
  }

  const onCancelReturn = async () => {
    await cancelReturn(undefined, {
      onSuccess: () => {
        toast.success(t("orders.returns.toast.canceledSuccessfully"))
      },
      onError: (error) => {
        toast.error(error.message)
      },
    })
  }

  if (!returnId || !isReturnRequest) {
    return
  }

  return (
    <div
      style={{
        background:
          "repeating-linear-gradient(-45deg, rgb(212, 212, 216, 0.15), rgb(212, 212, 216,.15) 10px, transparent 10px, transparent 20px)",
      }}
      className="-m-4 mb-1 border-b border-l p-4"
      data-testid="active-order-return-section"
    >
      <Container className="flex items-center justify-between p-0">
        <div className="flex w-full flex-row justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 px-6 pt-4" data-testid="active-order-return-header">
              <ArrowUturnLeft className="text-ui-fg-subtle" />
              <Heading level="h2" data-testid="active-order-return-heading">{t("orders.returns.panel.title")}</Heading>
            </div>

            <div className="gap-2 px-6 pb-4" data-testid="active-order-return-description">
              <Text>{t("orders.returns.panel.description")}</Text>
            </div>
          </div>

          <div className="flex items-center justify-end gap-x-2 rounded-b-xl px-4 py-4" data-testid="active-order-return-actions">
            <Button size="small" variant="secondary" onClick={onCancelReturn} data-testid="active-order-return-cancel-button">
              {t("orders.returns.cancel.title")}
            </Button>

            <Button size="small" variant="secondary" onClick={onContinueReturn} data-testid="active-order-return-continue-button">
              {t("actions.continue")}
            </Button>
          </div>
        </div>
      </Container>
    </div>
  )
}
