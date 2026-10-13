"use client"

import { Button } from "@/components/atoms"
import { UserNavigation } from "@/components/molecules"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { ArrowLeftIcon } from "@/icons"
import { ReturnItemsTab } from "./ReturnItemsTab"
import { useState } from "react"
import { ReturnSummaryTab } from "./ReturnSummaryTab"
import { createReturnRequest } from "@/lib/data/orders"
import { useRouter } from "next/navigation"

type SelectedItem = { id: string; quantity: number; reason_id: string }

export const OrderReturnSection = ({
  order,
  returnReasons,
}: {
  order: any
  returnReasons: any[]
}) => {
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([])
  const [note, setNote] = useState("")
  const [error, setError] = useState<boolean>(false)
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()

  const handleSelectItem = (item: any, reason_id: string = "") => {
    setError(false)
    if (!reason_id && selectedItems.some((i) => i.id === item.id)) {
      setSelectedItems(selectedItems.filter((i) => i.id !== item.id))
    } else if (selectedItems.some((i) => i.id === item.id)) {
      setSelectedItems(
        selectedItems.map((i) => (i.id === item.id ? { ...i, reason_id } : i))
      )
    } else {
      setSelectedItems([
        ...selectedItems,
        { id: item.id, quantity: item.quantity, reason_id },
      ])
    }
  }

  const handleSubmit = async () => {
    if (selectedItems.some((item) => !item.reason_id)) {
      setError(true)
      return
    }

    setSubmitting(true)
    try {
      const { return_request } = await createReturnRequest({
        order_id: order.id,
        items: selectedItems,
        description: note || undefined,
      })

      router.push(`/user/orders/${return_request.id}/request-success`)
    } catch (err) {
      setSubmitting(false)
      console.log("Error creating return request", err)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 mt-6 gap-5 md:gap-8">
      <UserNavigation />
      <div className="md:col-span-3 mb-8 md:mb-0">
        <LocalizedClientLink href={`/user/orders/${order.order_group.id}`}>
          <Button
            variant="tonal"
            className="label-md text-action-on-secondary uppercase flex items-center gap-2"
          >
            <ArrowLeftIcon className="size-4" />
            Order details
          </Button>
        </LocalizedClientLink>
        <div className="grid grid-cols-1 md:grid-cols-8 gap-4 mt-8">
          <div className="col-span-4">
            <ReturnItemsTab
              order={order}
              selectedItems={selectedItems}
              handleSelectItem={handleSelectItem}
              returnReasons={returnReasons}
              error={error}
            />
          </div>
          <div />
          <div className="col-span-4 md:col-span-3">
            <ReturnSummaryTab
              currency_code={order.currency_code}
              selectedItems={selectedItems}
              items={order.items}
              note={note}
              onNoteChange={setNote}
              submitting={submitting}
              handleSubmit={handleSubmit}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
