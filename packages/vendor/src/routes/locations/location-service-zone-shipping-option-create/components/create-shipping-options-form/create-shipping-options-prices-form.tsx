import { useEffect, useMemo, useState } from "react"
import { UseFormReturn, useWatch } from "react-hook-form"

import { DataGrid } from "../../../../../components/data-grid"
import {
  StackedFocusModal,
  useRouteModal,
  useStackedModal,
} from "../../../../../components/modals"
import { usePricePreferences } from "../../../../../hooks/api/price-preferences"
import { useRegions } from "../../../../../hooks/api/regions"
import { useStore } from "../../../../../hooks/api/store"
import { ConditionalPriceForm } from "../../../common/components/conditional-price-form"
import { ShippingOptionPriceProvider } from "../../../common/components/shipping-option-price-provider"
import {
  FulfillmentSetType,
  CONDITIONAL_PRICES_STACKED_MODAL_ID,
} from "../../../common/constants"
import { useShippingOptionPriceColumns } from "../../../common/hooks/use-shipping-option-price-columns"
import { ConditionalPriceInfo } from "../../../common/types"
import { CreateShippingOptionSchema } from "./schema"

type PricingPricesFormProps = {
  form: UseFormReturn<CreateShippingOptionSchema>
  type: FulfillmentSetType
}

export const CreateShippingOptionsPricesForm = ({
  form,
  type,
}: PricingPricesFormProps) => {
  const isPickup = type === FulfillmentSetType.Pickup
  const { getIsOpen, setIsOpen } = useStackedModal()
  const [selectedPrice, setSelectedPrice] =
    useState<ConditionalPriceInfo | null>(null)

  const onOpenConditionalPricesModal = (info: ConditionalPriceInfo) => {
    setIsOpen(CONDITIONAL_PRICES_STACKED_MODAL_ID, true)
    setSelectedPrice(info)
  }

  const onCloseConditionalPricesModal = () => {
    setIsOpen(CONDITIONAL_PRICES_STACKED_MODAL_ID, false)
    setSelectedPrice(null)
  }

  const {
    store,
    isLoading: isStoreLoading,
    isError: isStoreError,
    error: storeError,
  } = useStore()

  const currencies = useMemo(
    () => store?.supported_currencies?.map((c) => c.currency_code) || [],
    [store]
  )

  const {
    regions,
    isLoading: isRegionsLoading,
    isError: isRegionsError,
    error: regionsError,
  } = useRegions({
    fields: "id,name,currency_code",
    limit: 999,
  })

  const { price_preferences: pricePreferences } = usePricePreferences({})

  const { setCloseOnEscape } = useRouteModal()

  const name = useWatch({ control: form.control, name: "name" })

  const columns = useShippingOptionPriceColumns({
    name,
    currencies,
    regions,
    pricePreferences,
  })

  const isLoading = isStoreLoading || !store || isRegionsLoading || !regions

  const data = useMemo(
    () => [[...(currencies || []), ...(regions || [])]],
    [currencies, regions]
  )

  /**
   * Prefill prices with 0 if createing a pickup (shipping) option
   */
  useEffect(() => {
    if (!isLoading && isPickup) {
      if (currencies.length > 0) {
        currencies.forEach((currency) => {
          form.setValue(`currency_prices.${currency}`, "0")
        })
      }

      if (regions.length > 0) {
        regions.forEach((region) => {
          form.setValue(`region_prices.${region.id}`, "0")
        })
      }
    }
  }, [isLoading, isPickup])

  if (isStoreError) {
    throw storeError
  }

  if (isRegionsError) {
    throw regionsError
  }

  return (
    <StackedFocusModal
      id={CONDITIONAL_PRICES_STACKED_MODAL_ID}
      onOpenChangeCallback={(open) => {
        if (!open) {
          setSelectedPrice(null)
        }
      }}
    >
      <ShippingOptionPriceProvider
        onOpenConditionalPricesModal={onOpenConditionalPricesModal}
        onCloseConditionalPricesModal={onCloseConditionalPricesModal}
      >
        <div className="flex size-full flex-col divide-y overflow-hidden">
          <DataGrid
            isLoading={isLoading}
            data={data}
            columns={columns}
            state={form}
            onEditingChange={(editing) => setCloseOnEscape(!editing)}
            disableInteractions={getIsOpen(CONDITIONAL_PRICES_STACKED_MODAL_ID)}
          />
          {selectedPrice && (
            <ConditionalPriceForm info={selectedPrice} variant="create" />
          )}
        </div>
      </ShippingOptionPriceProvider>
    </StackedFocusModal>
  )
}
