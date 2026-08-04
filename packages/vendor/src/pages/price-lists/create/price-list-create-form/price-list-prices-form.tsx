import { HttpTypes } from "@medusajs/types"
import { OfferDTO } from "@mercurjs/types"
import { buildOfferGridData } from "@mercurjs/dashboard-shared"
import { useEffect, useMemo } from "react"
import { UseFormReturn, useWatch } from "react-hook-form"

import { DataGrid } from "@components/data-grid"
import { useRouteModal } from "@components/modals"
import { useOffers } from "@hooks/api/offers"
import { useProducts } from "@hooks/api/products"
import {
  PriceListGridRow,
  usePriceListGridColumns,
} from "@pages/price-lists/common/hooks/use-price-list-grid-columns"
import { PricingCreateSchemaType } from "./schema"

type PriceListPricesFormProps = {
  form: UseFormReturn<PricingCreateSchemaType>
  currencies: string[]
  regions: HttpTypes.AdminRegion[]
  pricePreferences: HttpTypes.AdminPricePreference[]
}

const OFFER_GRID_FIELDS =
  "id,variant_id,product_id,sku,product.title,product.thumbnail"

export const PriceListPricesForm = ({
  form,
  currencies,
  regions,
  pricePreferences,
}: PriceListPricesFormProps) => {
  const { setValue } = form
  const { setCloseOnEscape } = useRouteModal()

  const offerIds = useWatch({ control: form.control, name: "offer_ids" })
  const existingOffers = useWatch({ control: form.control, name: "offers" })

  const { offers: selectedOffers } = useOffers(
    {
      id: offerIds,
      limit: offerIds?.length || 1,
      fields: OFFER_GRID_FIELDS,
    },
    { enabled: (offerIds?.length ?? 0) > 0 }
  )

  const productIds = useMemo(
    () =>
      Array.from(
        new Set(
          ((selectedOffers ?? []) as OfferDTO[]).map((o) => o.product_id)
        )
      ),
    [selectedOffers]
  )

  const { products, isLoading } = useProducts(
    { id: productIds, limit: productIds.length || 1, fields: "id,*variants" },
    { enabled: productIds.length > 0 }
  )

  const { gridData, variantIdByOffer } = useMemo(
    () =>
      buildOfferGridData(
        (selectedOffers ?? []) as OfferDTO[],
        (products ?? []) as { variants?: { id: string; title?: string | null }[] | null }[]
      ),
    [selectedOffers, products]
  )

  // Seed an empty price entry per offer so the grid cells bind.
  useEffect(() => {
    for (const [offerId, variantId] of Object.entries(variantIdByOffer)) {
      if (!existingOffers?.[offerId]) {
        setValue(`offers.${offerId}`, {
          variant_id: variantId,
          currency_prices: {},
          region_prices: {},
        })
      }
    }
  }, [variantIdByOffer, existingOffers, setValue])

  const columns = usePriceListGridColumns({
    currencies,
    regions,
    pricePreferences,
  })

  return (
    <div className="flex size-full flex-col divide-y overflow-hidden">
      <DataGrid
        isLoading={isLoading}
        columns={columns}
        data={gridData as PriceListGridRow[]}
        state={form}
        onEditingChange={(editing) => setCloseOnEscape(!editing)}
      />
    </div>
  )
}
