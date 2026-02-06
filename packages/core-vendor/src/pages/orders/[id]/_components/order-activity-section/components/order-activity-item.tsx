import { Text, Tooltip, clx } from "@medusajs/ui"
import { PropsWithChildren } from "react"
import { AdminClaim, AdminExchange, AdminReturn, AdminOrderLineItem } from "@medusajs/types"
import { useDate } from "@hooks/use-date"
import ActivityItems from "../activity-items"

type OrderActivityItemProps = PropsWithChildren<{
  title: string | React.ReactNode
  timestamp: string | Date | null
  isFirst?: boolean
  itemsToSend?:
    | AdminClaim["additional_items"]
    | AdminExchange["additional_items"]
  itemsToReturn?: AdminReturn["items"]
  itemsMap?: Map<string, AdminOrderLineItem>
}>

export const OrderActivityItem = ({
  title,
  timestamp,
  isFirst = false,
  children,
  itemsToSend,
  itemsToReturn,
  itemsMap,
}: OrderActivityItemProps) => {
  const { getFullDate, getRelativeDate } = useDate()

  return (
    <div className="grid grid-cols-[20px_1fr] items-start gap-2">
      <div className="flex size-full flex-col items-center gap-y-0.5">
        <div className="flex size-5 items-center justify-center">
          <div className="bg-ui-bg-base shadow-borders-base flex size-2.5 items-center justify-center rounded-full">
            <div className="bg-ui-tag-neutral-icon size-1.5 rounded-full" />
          </div>
        </div>
        {!isFirst && <div className="bg-ui-border-base w-px flex-1" />}
      </div>
    <div
        className={clx({
          "pb-4": !isFirst,
        })}
      >
        <div className="flex items-center justify-between">
          {itemsToSend?.length || itemsToReturn?.length ? (
            <ActivityItems
              title={title as string}
              itemsToSend={itemsToSend}
              itemsToReturn={itemsToReturn}
              itemsMap={itemsMap}
            />
          ) : ( 
            <Text size="small" leading="compact" weight="plus">
              {title}
            </Text>
           )} 
          {timestamp && (
            <Tooltip
              content={getFullDate({
                date: timestamp,
                includeTime: true,
              })}
            >
              <Text
                size="small"
                leading="compact"
                className="text-ui-fg-subtle text-right"
              >
                {getRelativeDate(timestamp)}
              </Text>
            </Tooltip>
          )}
        </div>
        <div>{children}</div>
      </div>
    </div>
  )
}

