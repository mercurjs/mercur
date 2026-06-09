import { ArrowUturnLeft } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { Button, Container, Heading, Text, toast } from "@medusajs/ui"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"

import { useCancelReturnRequest } from "@hooks/api/returns"

/**
 * Striped banner shown above the order header while a return draft is
 * in flight (`order_change.change_type === "return_request"`). Ported
 * from Medusa admin's `ActiveOrderReturnSection` — same styling, swapped
 * hooks to the vendor SDK and the continue navigation target to the
 * vendor return-create modal route.
 */
type ActiveOrderReturnSectionProps = {
  orderPreview: HttpTypes.AdminOrderPreview
}

const readReturnId = (change: unknown): string | undefined => {
  if (
    change &&
    typeof change === "object" &&
    "return_id" in change &&
    typeof (change as { return_id?: unknown }).return_id === "string"
  ) {
    return (change as { return_id: string }).return_id
  }
  return undefined
}

export const ActiveOrderReturnSection = ({
  orderPreview,
}: ActiveOrderReturnSectionProps) => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const orderChange = orderPreview?.order_change
  const returnId = readReturnId(orderChange)
  const isReturnRequest =
    orderChange?.change_type === "return_request" && !!returnId

  const { mutateAsync: cancelReturn } = useCancelReturnRequest(
    returnId ?? "",
    orderPreview.id
  )

  if (!returnId || !isReturnRequest) {
    return null
  }

  const onContinueReturn = async () => {
    navigate(`/orders/${orderPreview.id}/returns/create`)
  }

  const onCancelReturn = async () => {
    await cancelReturn(undefined, {
      onSuccess: () => {
        toast.success(t("orders.returns.toast.canceledSuccessfully"))
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
      data-testid="active-order-return-section"
    >
      <Container className="flex items-center justify-between p-0">
        <div className="flex w-full flex-row justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 px-6 pt-4">
              <ArrowUturnLeft className="text-ui-fg-subtle" />
              <Heading level="h2">{t("orders.returns.panel.title")}</Heading>
            </div>

            <div className="gap-2 px-6 pb-4">
              <Text>{t("orders.returns.panel.description")}</Text>
            </div>
          </div>

          <div className="flex items-center justify-end gap-x-2 rounded-b-xl px-4 py-4">
            <Button
              size="small"
              variant="secondary"
              onClick={onCancelReturn}
              data-testid="active-order-return-cancel"
            >
              {t("orders.returns.cancel.title")}
            </Button>

            <Button
              size="small"
              variant="secondary"
              onClick={onContinueReturn}
              data-testid="active-order-return-continue"
            >
              {t("actions.continue")}
            </Button>
          </div>
        </div>
      </Container>
    </div>
  )
}
