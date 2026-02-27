import { Heading } from "@medusajs/ui"
import { useParams } from "react-router-dom"

import { RouteDrawer } from "../../../components/modals"
import { useCommissionRate } from "../../../hooks/api/commission-rates"
import { EditCommissionRateForm } from "./components/edit-commission-rate-form"

export const CommissionRateEdit = () => {
  const { id } = useParams()

  const {
    commission_rate,
    isPending: isLoading,
    isError,
    error,
  } = useCommissionRate(id!, { fields: "*rules" })

  if (isError) {
    throw error
  }

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <Heading>Edit Commission Rate</Heading>
      </RouteDrawer.Header>
      {!isLoading && commission_rate && (
        <EditCommissionRateForm commissionRate={commission_rate} />
      )}
    </RouteDrawer>
  )
}
