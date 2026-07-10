"use client"

import { convertToLocale } from "@/lib/helpers/money"
import React from "react"

type CartTotalsProps = {
  totals: {
    item_total?: number | null
    total?: number | null
    shipping_total?: number | null
    gift_card_total?: number | null
    currency_code: string
    shipping_subtotal?: number | null
  }
}

const OrderTotals: React.FC<CartTotalsProps> = ({ totals }) => {
  const {
    item_total,
    currency_code,
    total,
    gift_card_total,
    shipping_subtotal,
  } = totals

  return (
    <div className="border rounded-sm p-4 bg-white">
      <div className="flex flex-col gap-y-2 txt-medium text-ui-fg-subtle ">
        <div className="flex items-center justify-between">
          <span className="flex gap-x-1 items-center">Items</span>
          <span data-testid="cart-subtotal" data-value={item_total || 0}>
            {convertToLocale({ amount: item_total ?? 0, currency_code })}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Delivery</span>
          <span data-testid="cart-shipping" data-value={shipping_subtotal || 0}>
            {convertToLocale({ amount: shipping_subtotal ?? 0, currency_code })}
          </span>
        </div>
        {!!gift_card_total && (
          <div className="flex items-center justify-between">
            <span>Gift card</span>
            <span
              className="text-ui-fg-interactive"
              data-testid="cart-gift-card-amount"
              data-value={gift_card_total || 0}
            >
              -{" "}
              {convertToLocale({ amount: gift_card_total ?? 0, currency_code })}
            </span>
          </div>
        )}
      </div>
      <div className="h-px w-full border-b border-gray-200 my-4" />
      <div className="flex items-center justify-between text-ui-fg-base mb-2 txt-medium ">
        <span>Total</span>
        <span
          className="txt-xlarge-plus"
          data-testid="cart-total"
          data-value={total || 0}
        >
          {convertToLocale({ amount: total ?? 0, currency_code })}
        </span>
      </div>
    </div>
  )
}

export default OrderTotals
