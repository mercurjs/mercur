import { ShippingOptionPriceContext } from "./shipping-option-price-context"

import { PropsWithChildren } from "react"
import { ConditionalPriceInfo } from "../../types"

type ShippingOptionPriceProviderProps = PropsWithChildren<{
  onOpenConditionalPricesModal: (info: ConditionalPriceInfo) => void
  onCloseConditionalPricesModal: () => void
}>

export const ShippingOptionPriceProvider = ({
  children,
  onOpenConditionalPricesModal,
  onCloseConditionalPricesModal,
}: ShippingOptionPriceProviderProps) => {
  return (
    <ShippingOptionPriceContext.Provider
      value={{ onOpenConditionalPricesModal, onCloseConditionalPricesModal }}
    >
      {children}
    </ShippingOptionPriceContext.Provider>
  )
}
