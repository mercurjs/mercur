import { useParams } from "react-router-dom"

import { RouteFocusModal } from "@components/modals"
import { useCampaign } from "@hooks/api/campaigns"

import { AddCampaignPromotionsForm } from "./_components/add-campaign-promotions-form"

const AddCampaignPromotions = () => {
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

export const Component = AddCampaignPromotions
