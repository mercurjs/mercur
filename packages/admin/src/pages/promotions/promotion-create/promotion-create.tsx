import { Children, ReactNode } from "react"

import { RouteFocusModal } from "../../../components/modals"
import { TabbedForm } from "../../../components/tabbed-form/tabbed-form"
import { CreatePromotionForm } from "./components/create-promotion-form/create-promotion-form"
import { PromotionCampaignTab } from "./components/create-promotion-form/promotion-campaign-tab"
import { PromotionDetailsTab } from "./components/create-promotion-form/promotion-details-tab"
import { PromotionTemplateTab } from "./components/create-promotion-form/promotion-template-tab"
import { CreatePromotionSchema } from "./components/create-promotion-form/form-schema"

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <RouteFocusModal data-testid="promotion-create-modal">
      {Children.count(children) > 0 ? (
        children
      ) : (
        <CreatePromotionForm />
      )}
    </RouteFocusModal>
  )
}

export const PromotionCreatePage = Object.assign(Root, {
  Form: CreatePromotionForm,
  TemplateTab: PromotionTemplateTab,
  DetailsTab: PromotionDetailsTab,
  CampaignTab: PromotionCampaignTab,
  Tab: TabbedForm.Tab,
})

export { CreatePromotionSchema }

// Keep backward-compatible named export for route `Component`
export const PromotionCreate = Root
