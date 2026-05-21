import { Input, Select } from "@medusajs/ui"
import { useFormContext } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { Form } from "../../../../components/common/form"
import { defineTabMeta } from "../../../../components/tabbed-form/types"
import { useShippingProfiles } from "../../../../hooks/api/shipping-profiles"
import { useDocumentDirection } from "../../../../hooks/use-document-direction"
import { CreateOfferFormValues } from "./schema"

const Root = () => {
  const { t } = useTranslation()
  const dir = useDocumentDirection()
  const form = useFormContext<CreateOfferFormValues>()
  const { shipping_profiles } = useShippingProfiles({ limit: 1000 })

  return (
    <div
      className="flex flex-col items-center p-16"
      data-testid="offer-create-tab-details"
    >
      <div className="flex w-full max-w-[720px] flex-col gap-y-8">
        <Form.Field
          control={form.control}
          name="sku"
          render={({ field }) => (
            <Form.Item>
              <Form.Label>{t("offers.fields.sku")}</Form.Label>
              <Form.Control>
                <Input
                  autoComplete="off"
                  maxLength={64}
                  {...field}
                  data-testid="offer-create-sku-input"
                />
              </Form.Control>
              <Form.ErrorMessage />
            </Form.Item>
          )}
        />

        <Form.Field
          control={form.control}
          name="shipping_profile_id"
          render={({ field: { ref: _ref, onChange, ...field } }) => (
            <Form.Item>
              <Form.Label>{t("offers.fields.shippingProfile")}</Form.Label>
              <Form.Control>
                <Select
                  {...field}
                  onValueChange={onChange}
                  dir={dir}
                >
                  <Select.Trigger
                    ref={_ref}
                    data-testid="offer-create-shipping-profile-trigger"
                  >
                    <Select.Value />
                  </Select.Trigger>
                  <Select.Content>
                    {(shipping_profiles ?? []).map((profile) => (
                      <Select.Item key={profile.id} value={profile.id}>
                        {profile.name}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select>
              </Form.Control>
              <Form.ErrorMessage />
            </Form.Item>
          )}
        />
      </div>
    </div>
  )
}

Root._tabMeta = defineTabMeta<CreateOfferFormValues>({
  id: "details",
  labelKey: "offers.create.tabs.details",
  validationFields: ["sku", "shipping_profile_id"],
})

export const CreateOfferDetailsTab = Root
