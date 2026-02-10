import { Button, Text, usePrompt } from "@medusajs/ui"
import { AdminOrderChange } from "@medusajs/types"
import { useTranslation } from "react-i18next"
import { useCancelOrderTransfer, useCustomer } from "@hooks/api"

type TransferOrderRequestBodyProps = {
  transfer: AdminOrderChange
}

export const TransferOrderRequestBody = ({
  transfer,
}: TransferOrderRequestBodyProps) => {
  const prompt = usePrompt()
  const { t } = useTranslation()

  const action = transfer.actions[0]
  const { customer } = useCustomer(action.reference_id)

  const isCompleted = !!transfer.confirmed_at

  const { mutateAsync: cancelTransfer } = useCancelOrderTransfer(
    transfer.order_id
  )

  const handleDelete = async () => {
    const res = await prompt({
      title: t("general.areYouSure"),
      description: t("actions.cannotUndo"),
      confirmText: t("actions.delete"),
      cancelText: t("actions.cancel"),
    })

    if (!res) {
      return
    }

    await cancelTransfer()
  }

  /**
   * TODO: change original_email to customer info when action details is changed
   */

  return (
    <div>
      <Text size="small" className="text-ui-fg-subtle">
        {t("orders.activity.from")}: {String(action.details?.original_email || "")}
      </Text>

      <Text size="small" className="text-ui-fg-subtle">
        {t("orders.activity.to")}:{" "}
        {customer?.first_name
          ? `${customer?.first_name} ${customer?.last_name}`
          : customer?.email}
      </Text>
      {!isCompleted && (
        <Button
          onClick={handleDelete}
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

