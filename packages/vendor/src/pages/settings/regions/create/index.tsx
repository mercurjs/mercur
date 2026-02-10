import { RouteFocusModal } from "@components/modals/route-focus-modal"
import { usePaymentProviders } from "@hooks/api/payments"
import { useStore } from "@hooks/api/store"
import { currencies } from "@lib/data/currencies"
import { CreateRegionForm } from "./_components/create-region-form"

const RegionCreate = () => {
  const { store, isPending: isLoading, isError, error } = useStore()

  const storeCurrencies = (store?.supported_currencies ?? []).map(
    (c) => currencies[c.currency_code.toUpperCase()]
  )
  const { payment_providers: paymentProviders = [] } = usePaymentProviders({
    is_enabled: true,
  })

  if (isError) {
    throw error
  }

  return (
    <RouteFocusModal>
      {!isLoading && store && (
        <CreateRegionForm
          currencies={storeCurrencies}
          paymentProviders={paymentProviders}
        />
      )}
    </RouteFocusModal>
  )
}

export const Component = RegionCreate
