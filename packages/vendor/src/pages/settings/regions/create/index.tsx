import { RouteFocusModal } from "@components/modals/route-focus-modal"
import { usePaymentProviders } from "@hooks/api/payments"
import { useStoreCurrencies } from "@hooks/api/use-store-currencies"
import { currencies } from "@lib/data/currencies"
import { CreateRegionForm } from "./_components/create-region-form"

const RegionCreate = () => {
  const { currencies: storeCurrencyList, isPending: isLoading } = useStoreCurrencies()

  const storeCurrencies = (storeCurrencyList ?? []).map(
    (c) => currencies[c.currency_code.toUpperCase()]
  )
  const { payment_providers: paymentProviders = [] } = usePaymentProviders({
    is_enabled: true,
  })

  return (
    <RouteFocusModal>
      {!isLoading && storeCurrencyList && (
        <CreateRegionForm
          currencies={storeCurrencies}
          paymentProviders={paymentProviders}
        />
      )}
    </RouteFocusModal>
  )
}

export const Component = RegionCreate
