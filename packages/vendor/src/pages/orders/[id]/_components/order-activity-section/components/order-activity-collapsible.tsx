import { Text } from "@medusajs/ui"
import { Collapsible as RadixCollapsible } from "radix-ui"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Activity } from "../hooks/use-activity-items"
import { OrderActivityItem } from "./order-activity-item"

type OrderActivityCollapsibleProps = {
  activities: Activity[]
}

export const OrderActivityCollapsible = ({
  activities,
}: OrderActivityCollapsibleProps) => {
  const [open, setOpen] = useState(false)

  const { t } = useTranslation()

  if (!activities.length) {
    return null
  }

  return (
    <RadixCollapsible.Root open={open} onOpenChange={setOpen}>
      {!open && (
        <div className="grid grid-cols-[20px_1fr] items-start gap-2">
          <div className="flex size-full flex-col items-center">
            <div className="border-ui-border-strong w-px flex-1 bg-[linear-gradient(var(--border-strong)_33%,rgba(255,255,255,0)_0%)] bg-[length:1px_3px] bg-right bg-repeat-y" />
          </div>
          <div className="pb-4">
            <RadixCollapsible.Trigger className="text-left">
              <Text
                size="small"
                leading="compact"
                weight="plus"
                className="text-ui-fg-muted"
              >
                {t("orders.activity.showMoreActivities", {
                  count: activities.length,
                })}
              </Text>
            </RadixCollapsible.Trigger>
          </div>
        </div>
      )}
      <RadixCollapsible.Content>
        <div className="flex flex-col gap-y-0.5">
          {activities.map((item, index) => {
            return (
              <OrderActivityItem
                key={index}
                title={item.title}
                timestamp={item.timestamp}
                itemsToSend={item.itemsToSend}
                itemsToReturn={item.itemsToReturn}
                itemsMap={item.itemsMap}
              >
                {item.children}
              </OrderActivityItem>
            )
          })}
        </div>
      </RadixCollapsible.Content>
    </RadixCollapsible.Root>
  )
}

