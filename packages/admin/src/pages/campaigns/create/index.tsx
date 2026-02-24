import { RouteFocusModal } from "@components/modals"

import { CreateCampaignForm } from "./_components/create-campaign-form"

const CampaignCreate = () => {
  return (
    <RouteFocusModal>
      <CreateCampaignForm />
    </RouteFocusModal>
  )
}

export const Component = CampaignCreate
