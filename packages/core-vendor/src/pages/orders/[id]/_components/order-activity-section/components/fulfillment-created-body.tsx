import { Text } from "@medusajs/ui"
import { AdminFulfillment } from "@medusajs/types"
import { useTranslation } from "react-i18next"

type FulfillmentCreatedBodyProps = {
  fulfillment: AdminFulfillment
  isShipment?: boolean
}

export const FulfillmentCreatedBody = ({
  fulfillment,
}: FulfillmentCreatedBodyProps) => {
  const { t } = useTranslation()

  const numberOfItems = (fulfillment.items || []).reduce((acc, item) => {
    return acc + (item.quantity || 0)
  }, 0)

  return (
    <div>
      <Text size="small" className="text-ui-fg-subtle">
        {t("orders.activity.events.fulfillment.items", {
          count: numberOfItems,
        })}
      </Text>
    </div>
  )
}

