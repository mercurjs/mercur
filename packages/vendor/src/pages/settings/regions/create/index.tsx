import { RouteFocusModal } from "@components/modals/route-focus-modal"
import { usePaymentProviders } from "@hooks/api/payments"
import { useCurrentSeller } from "@hooks/api/sellers"
import { currencies } from "@lib/data/currencies"
import { CreateRegionForm } from "./_components/create-region-form"

const RegionCreate = () => {
  const {
    currency_code,
    isPending: isLoading,
    isError,
    error,
  } = useCurrentSeller()

  const sellerCurrency = currency_code
    ? currencies[currency_code.toUpperCase()]
    : undefined
  const { payment_providers: paymentProviders = [] } = usePaymentProviders({
    is_enabled: true,
  })

  if (isError) {
    throw error
  }

  return (
    <RouteFocusModal>
      {!isLoading && sellerCurrency && (
        <CreateRegionForm
          currencies={[sellerCurrency]}
          paymentProviders={paymentProviders}
        />
      )}
    </RouteFocusModal>
  )
}

export const Component = RegionCreate
