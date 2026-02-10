import { Button, Text, usePrompt } from "@medusajs/ui"
import { AdminReturn } from "@medusajs/types"
import { useTranslation } from "react-i18next"
import { useCancelReturn } from "@hooks/api/returns"

type ReturnBodyProps = {
  orderReturn: AdminReturn
  isCreated: boolean
  isReceived?: boolean
}

export const ReturnBody = ({
  orderReturn,
  isCreated,
  isReceived,
}: ReturnBodyProps) => {
  const prompt = usePrompt()
  const { t } = useTranslation()

  const { mutateAsync: cancelReturnRequest } = useCancelReturn(
    orderReturn.id,
    orderReturn.order_id
  )

  const onCancel = async () => {
    const res = await prompt({
      title: t("orders.returns.cancel.title"),
      description: t("orders.returns.cancel.description"),
      confirmText: t("actions.confirm"),
      cancelText: t("actions.cancel"),
    })

    if (!res) {
      return
    }

    await cancelReturnRequest()
  }

  const numberOfItems = orderReturn.items.reduce((acc, item) => {
    return acc + (isReceived ? item.received_quantity : item.quantity) // TODO: revisit when we add dismissed quantity on ReturnItem
  }, 0)

  return (
    <div className="flex items-start gap-1">
      <Text size="small" className="text-ui-fg-subtle">
        {t("orders.activity.events.return.items", {
          count: numberOfItems,
        })}
      </Text>
      {isCreated && (
        <>
          <div className="mt-[2px] flex items-center leading-none">⋅</div>
          <Button
            onClick={onCancel}
            className="text-ui-fg-subtle h-auto px-0 leading-none hover:bg-transparent"
            variant="transparent"
            size="small"
          >
            {t("actions.cancel")}
          </Button>
        </>
      )}
    </div>
  )
}

