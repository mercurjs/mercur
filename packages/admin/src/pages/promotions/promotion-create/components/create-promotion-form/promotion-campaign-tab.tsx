import { useWatch } from "react-hook-form"

import { useTabbedForm } from "../../../../../components/tabbed-form/tabbed-form"
import { defineTabMeta } from "../../../../../components/tabbed-form/types"
import { AddCampaignPromotionFields } from "../../../promotion-add-campaign/components/add-campaign-promotion-form"
import { CreatePromotionSchemaType } from "./form-schema"

const Root = () => {
  const form = useTabbedForm<CreatePromotionSchemaType>()

  const currencyCode = useWatch({
    control: form.control,
    name: "application_method.currency_code",
  })

  return (
    <div className="flex flex-col items-center">
      <div className="flex w-full max-w-[720px] flex-col gap-y-8 py-16">
        <AddCampaignPromotionFields
          form={form}
          promotionCurrencyCode={currencyCode}
        />
      </div>
    </div>
  )
}

Root._tabMeta = defineTabMeta<CreatePromotionSchemaType>({
  id: "campaign",
  labelKey: "promotions.tabs.campaign",
  validationFields: ["campaign_id", "campaign_choice", "campaign"],
})

export const PromotionCampaignTab = Root
