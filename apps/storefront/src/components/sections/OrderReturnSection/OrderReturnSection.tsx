"use client"

import { Button } from "@/components/atoms"
import { UserNavigation } from "@/components/molecules"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { ArrowLeftIcon } from "@/icons"
import { ReturnItemsTab } from "./ReturnItemsTab"
import { useState } from "react"
import { ReturnSummaryTab } from "./ReturnSummaryTab"
import { ReturnMethodsTab } from "./ReturnMethodsTab"
import { StepProgressBar } from "@/components/cells/StepProgressBar/StepProgressBar"
import { createReturnRequest } from "@/lib/data/orders"
import { useRouter } from "next/navigation"

export const OrderReturnSection = ({
  order,
  returnReasons,
  shippingMethods,
}: {
  order: any
  returnReasons: any[]
  shippingMethods: any[]
}) => {
  const [tab, setTab] = useState(0)
  const [selectedItems, setSelectedItems] = useState<any[]>([])
  const [error, setError] = useState<boolean>(false)
  const [returnMethod, setReturnMethod] = useState<any>(null)
  const router = useRouter()

  const handleTabChange = (tab: number) => {
    const noReason = selectedItems.filter((item) => !item.reason_id)
    if (!noReason.length) {
      setTab(tab)
    } else {
      setError(true)
    }
  }

  const handleSetReturnMethod = (method: any) => {
    setReturnMethod(method)
  }

  const handleSelectItem = (item: any, reason_id: string = "") => {
    setError(false)
    if (!reason_id && selectedItems.some((i) => i.line_item_id === item.id)) {
      setSelectedItems(selectedItems.filter((i) => i.line_item_id !== item.id))
    } else {
      const itemToChange = selectedItems.find((i) => i.line_item_id === item.id)
      if (itemToChange) {
        setSelectedItems(
          selectedItems.map((i) =>
            i.line_item_id === item.id ? { ...i, reason_id } : i
          )
        )
      } else {
        setSelectedItems([
          ...selectedItems,
          { line_item_id: item.id, quantity: item.quantity, reason_id },
        ])
      }
    }
  }

  const handleSubmit = async () => {
    const data = {
      order_id: order.id,
      customer_note: "",
      shipping_option_id: returnMethod,
      line_items: selectedItems,
    }

    const { order_return_request } = await createReturnRequest(data)

    if (!order_return_request.id) {
      return console.log("Error creating return request")
    }

    router.push(`/user/orders/${order_return_request.id}/request-success`)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 mt-6 gap-5 md:gap-8">
      <UserNavigation />
      <div className="md:col-span-3 mb-8 md:mb-0">
        {tab === 0 ? (
          <LocalizedClientLink href={`/user/orders/${order.order_set.id}`}>
            <Button
              variant="tonal"
              className="label-md text-action-on-secondary uppercase flex items-center gap-2"
            >
              <ArrowLeftIcon className="size-4" />
              Order details
            </Button>
          </LocalizedClientLink>
        ) : (
          <Button
            variant="tonal"
            className="label-md text-action-on-secondary uppercase flex items-center gap-2"
            onClick={() => setTab(0)}
          >
            <ArrowLeftIcon className="size-4" />
            Select items
          </Button>
        )}
        <div className="grid grid-cols-1 md:grid-cols-8 gap-4 mt-8">
          <div className="col-span-4">
            <div className="mb-4">
              <StepProgressBar
                steps={["SELECT ITEMS TO RETURN", "SELECT RETURN METHOD"]}
                currentStep={tab}
              />
            </div>
            {tab === 0 && (
              <ReturnItemsTab
                order={order}
                selectedItems={selectedItems}
                handleSelectItem={handleSelectItem}
                returnReasons={returnReasons}
                error={error}
              />
            )}
            {tab === 1 && (
              <ReturnMethodsTab
                shippingMethods={shippingMethods}
                handleSetReturnMethod={handleSetReturnMethod}
                returnMethod={returnMethod}
                seller={order.seller}
              />
            )}
          </div>
          <div />
          <div className="col-span-4 md:col-span-3">
            <ReturnSummaryTab
              currency_code={order.currency_code}
              selectedItems={selectedItems}
              items={order.items}
              handleTabChange={handleTabChange}
              tab={tab}
              returnMethod={returnMethod}
              handleSubmit={handleSubmit}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
