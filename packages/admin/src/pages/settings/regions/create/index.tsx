import { RouteFocusModal } from "@components/modals"
import { useStore } from "@hooks/api/store"
import { currencies } from "@lib/data/currencies"

import { CreateRegionForm } from "./_components/create-region-form"

const RegionCreate = () => {
  const { store, isPending: isLoading, isError, error } = useStore()

  const storeCurrencies = (store?.supported_currencies ?? []).map(
    (c) => currencies[c.currency_code.toUpperCase()]
  )

  if (isError) {
    throw error
  }

  return (
    <RouteFocusModal data-testid="region-create-modal">
      {!isLoading && store && <CreateRegionForm currencies={storeCurrencies} />}
    </RouteFocusModal>
  )
}

export const Component = RegionCreate
