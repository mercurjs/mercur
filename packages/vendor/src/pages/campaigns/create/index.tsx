// Route: /campaigns/create
import { RouteFocusModal } from "@components/modals"
import { CreateCampaignForm } from "./create-campaign-form"

export const Component = () => {
  return (
    <RouteFocusModal>
      <CreateCampaignForm />
    </RouteFocusModal>
  )
}
