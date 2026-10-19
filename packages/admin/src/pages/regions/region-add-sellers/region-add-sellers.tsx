import { useParams } from "react-router-dom"
import { RouteFocusModal } from "../../../components/modals"
import { useRegion } from "../../../hooks/api/regions"
import { AddSellersForm } from "./components/add-sellers-form"

export const RegionAddSellers = () => {
  const { id } = useParams()

  const {
    region,
    isPending: isLoading,
    isError,
    error,
  } = useRegion(id!, { fields: "id,name" })

  if (isError) {
    throw error
  }

  return (
    <RouteFocusModal data-testid="region-add-sellers-modal">
      {!isLoading && region && <AddSellersForm region={region} />}
    </RouteFocusModal>
  )
}
