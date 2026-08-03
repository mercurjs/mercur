import { HttpTypes } from "@medusajs/types"
import { OfferDTO } from "@mercurjs/types"
import { useEffect, useMemo } from "react"
import { useWatch } from "react-hook-form"
import { DataGrid } from "../../../../../components/data-grid"
import { useRouteModal } from "../../../../../components/modals"
import { useTabbedForm } from "../../../../../components/tabbed-form/tabbed-form"
import { defineTabMeta } from "../../../../../components/tabbed-form/types"
import { useOffers } from "../../../../../hooks/api/offers"
import { useProducts } from "../../../../../hooks/api/products"
import {
  PriceListGridRow,
  usePriceListGridColumns,
} from "../../../common/hooks/use-price-list-grid-columns"
import { buildOfferGridData } from "../../../common/build-offer-grid-data"
import { PricingCreateSchemaType } from "./schema"

type PriceListPricesFormProps = {
  currencies: HttpTypes.AdminStoreCurrency[]
  regions: HttpTypes.AdminRegion[]
  pricePreferences: HttpTypes.AdminPricePreference[]
}

const Root = ({
  currencies,
  regions,
  pricePreferences,
}: PriceListPricesFormProps) => {
  const form = useTabbedForm<PricingCreateSchemaType>()
  const { setValue } = form
  const { setCloseOnEscape } = useRouteModal()

  const offerIds = useWatch({ control: form.control, name: "offer_ids" })
  const existingOffers = useWatch({ control: form.control, name: "offers" })

  const { offers: selectedOffers } = useOffers(
    {
      id: offerIds,
      limit: offerIds?.length || 1,
      fields:
        "id,variant_id,product_id,seller_id,sku,seller.name,product.title,product.thumbnail",
    },
    { enabled: (offerIds?.length ?? 0) > 0 }
  )

  const productIds = useMemo(
    () =>
      Array.from(
        new Set((selectedOffers ?? []).map((o: OfferDTO) => o.product_id))
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
        products ?? []
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

Root._tabMeta = defineTabMeta<PricingCreateSchemaType>({
  id: "price",
  labelKey: "priceLists.create.tabs.prices",
  validationFields: ["offers"],
})

export const PriceListPricesForm = Root
