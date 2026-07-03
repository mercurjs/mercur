import { Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"

import { RouteDrawer } from "@components/modals"
import { usePaymentProviders } from "@hooks/api/payments"
import { useRegion } from "@hooks/api/regions"
import { useCurrentSeller } from "@hooks/api/sellers"
import { currencies } from "@lib/data/currencies"
import { EditRegionForm } from "./_components/edit-region-form"
import { usePricePreferences } from "@hooks/api/price-preferences"

const RegionEdit = () => {
  const { t } = useTranslation()
  const { id } = useParams()

  const {
    region,
    isPending: isRegionLoading,
    isError: isRegionError,
    error: regionError,
  } = useRegion(id!, {
    fields: "*payment_providers,*countries,+automatic_taxes",
  })

  const {
    currency_code,
    isPending: isSellerLoading,
    isError: isSellerError,
    error: sellerError,
  } = useCurrentSeller()

  const {
    price_preferences: pricePreferences = [],
    isPending: isPreferenceLoading,
    isError: isPreferenceError,
    error: preferenceError,
  } = usePricePreferences(
    {
      attribute: "region_id",
      value: id,
    },
    { enabled: !!region }
  )

  const isLoading = isRegionLoading || isSellerLoading || isPreferenceLoading

  const sellerCurrencies = currency_code
    ? [currencies[currency_code.toUpperCase()]]
    : []
  const { payment_providers: paymentProviders = [] } = usePaymentProviders({
    limit: 999,
    is_enabled: true,
  })

  if (isRegionError) {
    throw regionError
  }

  if (isSellerError) {
    throw sellerError
  }

  if (isPreferenceError) {
    throw preferenceError
  }

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <Heading>{t("regions.editRegion")}</Heading>
      </RouteDrawer.Header>
      {!isLoading && region && (
        <EditRegionForm
          region={region}
          currencies={sellerCurrencies}
          paymentProviders={paymentProviders}
          pricePreferences={pricePreferences}
        />
      )}
    </RouteDrawer>
  )
}

export const Component = RegionEdit
