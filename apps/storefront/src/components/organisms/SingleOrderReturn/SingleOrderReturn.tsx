"use client"

import { Avatar, Badge, Button, Card, Divider } from "@/components/atoms"
import { CollapseIcon } from "@/icons"
import { cn } from "@/lib/utils"
import { Heading } from "@medusajs/ui"
import { format } from "date-fns"
import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { convertToLocale } from "@/lib/helpers/money"
import { StepProgressBar } from "@/components/cells/StepProgressBar/StepProgressBar"
import { withdrawReturnRequest, type StoreReturnRequest } from "@/lib/data/orders"

const STEPS = ["requested", "accepted", "returned", "refunded"]

const stepFor = (status: string) => {
  switch (status) {
    case "accepted":
    case "awaiting_return":
      return 1
    case "returned":
      return 2
    case "refunded":
      return 3
    default:
      return 0
  }
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Waiting for the seller",
  accepted: "Accepted, refund pending",
  awaiting_return: "Send the item back",
  returned: "Item received, refund pending",
  refunded: "Refunded",
  declined: "Declined",
  withdrawn: "Withdrawn",
}

type RequestedItem = {
  key: string
  line_item_id: string
  quantity: number
  reason: string
}

const requestedItems = (
  item: StoreReturnRequest,
  returnReasons: Array<{ id: string; label: string }>
): RequestedItem[] =>
  item.items.map((requested) => ({
    key: requested.id,
    line_item_id: requested.id,
    quantity: Number(requested.quantity),
    reason:
      returnReasons.find((r) => r.id === requested.reason_id)?.label ||
      "No reason provided",
  }))

export const SingleOrderReturn = ({
  item,
  order,
  defaultOpen,
  returnReason,
  priceTestId,
  testIdPrefix,
}: {
  item: StoreReturnRequest
  order?: any
  user: any
  defaultOpen: boolean
  returnReason: any[]
  priceTestId?: string
  testIdPrefix?: string
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [height, setHeight] = useState(0)
  const [withdrawing, setWithdrawing] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    setTimeout(() => {
      if (contentRef.current) {
        setHeight(contentRef.current.scrollHeight)
      }
    }, 100)
  }, [])

  const orderItems: any[] = order?.items ?? []
  const items = requestedItems(item, returnReason).map((requested) => ({
    ...requested,
    orderItem: orderItems.find((i: any) => i.id === requested.line_item_id),
  }))

  const currency_code = order?.currency_code || "usd"
  const total = items.reduce(
    (acc, entry) => acc + (entry.orderItem?.unit_price ?? 0) * entry.quantity,
    0
  )

  const isTerminal = item.status === "declined" || item.status === "withdrawn"

  const handleWithdraw = async () => {
    setWithdrawing(true)
    try {
      await withdrawReturnRequest(item.id)
      router.refresh()
    } finally {
      setWithdrawing(false)
    }
  }

  return (
    <>
      <Card className="bg-secondary p-4 flex justify-between mt-8" data-testid={testIdPrefix ? `${testIdPrefix}-header` : undefined}>
        <Heading level="h2" data-testid={testIdPrefix ? `${testIdPrefix}-order-id` : undefined}>
          Order: #{order?.display_id ?? "—"}
        </Heading>
        <div className="flex flex-col gap-2 items-center">
          <p className="label-sm text-secondary" data-testid={testIdPrefix ? `${testIdPrefix}-requested-date` : undefined}>
            Return requested date: {format(item.created_at, "MMM dd, yyyy")}
          </p>
        </div>
      </Card>
      <Card className="p-0" data-testid={testIdPrefix ? `${testIdPrefix}-details` : undefined}>
        <div
          className="p-4 flex justify-between items-center cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
        >
          <Heading level="h3" className="uppercase label-md !font-semibold" data-testid={testIdPrefix ? `${testIdPrefix}-status` : undefined}>
            {STATUS_LABELS[item.status] ?? item.status}
          </Heading>
          <p className="label-sm text-secondary flex gap-2" data-testid={testIdPrefix ? `${testIdPrefix}-items-count` : undefined}>
            {items.length} {items.length > 1 ? "items" : "item"}
            <CollapseIcon
              className={cn(
                "w-5 h-5 text-secondary transition-transform duration-300",
                isOpen ? "rotate-180" : ""
              )}
            />
          </p>
        </div>
        <div
          className={cn("transition-all duration-300 overflow-hidden")}
          style={{
            maxHeight: isOpen ? `${height}px` : "0px",
            opacity: isOpen ? 1 : 0,
            transition: "max-height 0.3s ease-in-out, opacity 0.2s ease-in-out",
          }}
          ref={contentRef}
        >
          <Divider />
          <div className="p-4 uppercase">
            {isTerminal ? (
              <Badge className="bg-primary text-primary border rounded-sm">
                {STATUS_LABELS[item.status]}
              </Badge>
            ) : (
              <StepProgressBar steps={STEPS} currentStep={stepFor(item.status)} />
            )}
          </div>
          {item.note && (
            <>
              <Divider />
              <p className="p-4 label-md text-secondary" data-testid={testIdPrefix ? `${testIdPrefix}-note` : undefined}>
                {item.note}
              </p>
            </>
          )}
          <Divider />
          <div className="p-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Avatar src="/talkjs-placeholder.jpg" />
              <p className="label-lg text-primary" data-testid={testIdPrefix ? `${testIdPrefix}-seller-name` : undefined}>
                {item.seller?.name}
              </p>
            </div>
            {item.status === "pending" && (
              <Button
                variant="tonal"
                className="uppercase"
                disabled={withdrawing}
                onClick={handleWithdraw}
                data-testid={testIdPrefix ? `${testIdPrefix}-withdraw` : undefined}
              >
                Withdraw request
              </Button>
            )}
          </div>
          <Divider />
          <div className="p-4 flex justify-between w-full">
            <div className="flex flex-col gap-4 w-full">
              {items.map((entry) => (
                <div key={entry.key} className="flex items-center gap-2" data-testid={testIdPrefix ? `${testIdPrefix}-item-${entry.line_item_id}` : undefined}>
                  <div className="flex items-center gap-4 w-1/2">
                    <div className="rounded-sm overflow-hidden border">
                      {entry.orderItem?.thumbnail ? (
                        <Image
                          src={entry.orderItem.thumbnail}
                          alt={entry.orderItem.title}
                          width={60}
                          height={60}
                        />
                      ) : (
                        <Image
                          src="/images/placeholder.svg"
                          alt={entry.orderItem?.title ?? ""}
                          width={60}
                          height={60}
                          className="scale-50 opacity-25"
                        />
                      )}
                    </div>
                    <div>
                      <p className="label-md !font-semibold text-primary" data-testid={testIdPrefix ? `${testIdPrefix}-item-${entry.line_item_id}-title` : undefined}>
                        {entry.orderItem?.title}
                      </p>
                      <p className="label-md text-secondary" data-testid={testIdPrefix ? `${testIdPrefix}-item-${entry.line_item_id}-subtitle` : undefined}>
                        {entry.orderItem?.variant_title} · x{entry.quantity}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-between w-1/2">
                    <p className="label-md !font-semibold text-primary" data-testid={testIdPrefix ? `${testIdPrefix}-item-${entry.line_item_id}-reason` : undefined}>
                      <Badge className="bg-primary text-primary border rounded-sm">
                        {entry.reason}
                      </Badge>
                    </p>
                    <p className="label-md !font-semibold text-primary" data-testid={testIdPrefix ? `${testIdPrefix}-item-${entry.line_item_id}-price` : undefined}>
                      {convertToLocale({
                        amount: (entry.orderItem?.unit_price ?? 0) * entry.quantity,
                        currency_code,
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <Divider />
          <div className="p-4 flex justify-between">
            <p className="label-md text-secondary">Total:</p>
            <p className="label-md !font-semibold text-primary" data-testid={priceTestId}>
              {convertToLocale({ amount: total, currency_code })}
            </p>
          </div>
        </div>
      </Card>
    </>
  )
}
