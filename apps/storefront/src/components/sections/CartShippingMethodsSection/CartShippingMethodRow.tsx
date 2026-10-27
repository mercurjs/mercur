"use client"

import { Button } from "@/components/atoms"
import { BinIcon } from "@/icons"

import { DeliveryEstimate } from "@/components/molecules/DeliveryEstimate/DeliveryEstimate"
import type { DeliveryEstimate as DeliveryEstimateValue } from "@/lib/helpers/delivery-estimate"
import { convertToLocale } from "@/lib/helpers/money"
import { HttpTypes } from "@medusajs/types"
import { Text } from "@medusajs/ui"

export const CartShippingMethodRow = ({
  method,
  sellerName,
  estimate,
  currency_code,
  onRemoveShippingMethod,
}: {
  method: HttpTypes.StoreCartShippingMethod
  sellerName?: string
  estimate?: DeliveryEstimateValue | null
  currency_code: string
  onRemoveShippingMethod: (methodId: string) => void
}) => {
  return (
    <div className="mb-4 border rounded-md p-4 flex items-center justify-between">
      <div>
        <Text className="txt-medium-plus text-ui-fg-base mb-1">
          {sellerName ?? "Method"}
        </Text>
        <Text className="txt-medium text-ui-fg-subtle">
          {method?.name}{" "}
          {convertToLocale({
            amount: method?.amount!,
            currency_code: currency_code,
          })}
        </Text>
        <DeliveryEstimate
          estimate={estimate}
          className="mt-1"
          data-testid="cart-shipping-method-delivery-estimate"
        />
      </div>

      <Button
        variant="tonal"
        size="small"
        className="p-2"
        onClick={() => onRemoveShippingMethod(method.id)}
      >
        <BinIcon size={16} />
      </Button>
    </div>
  )
}
