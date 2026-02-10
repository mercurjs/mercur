// Route: /campaigns/:id/add-promotions
import { useParams } from "react-router-dom"
import { RouteFocusModal } from "@components/modals"
import { useCampaign } from "@hooks/api/campaigns"
import { AddCampaignPromotionsForm } from "./add-campaign-promotions-form"

export const Component = () => {
  const { id } = useParams()
  const { campaign, isError, error } = useCampaign(id!)

  if (isError) {
    throw error
  }

  return (
    <RouteFocusModal>
      {campaign && <AddCampaignPromotionsForm campaign={campaign} />}
    </RouteFocusModal>
  )
}
