import { Divider, Heading, Input, RadioGroup, Select, Text } from "@medusajs/ui"
import type { UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"

import type { HttpTypes } from "@medusajs/types"

import { Form } from "../../../../../components/common/form"
import { SwitchBox } from "../../../../../components/common/switch-box"
import { Combobox } from "../../../../../components/inputs/combobox"
import { useComboboxData } from "../../../../../hooks/use-combobox-data"
import { sdk } from "../../../../../lib/client"
import { formatProvider } from "../../../../../lib/format-provider"
import { FulfillmentSetType, ShippingOptionPriceType, } from "../../../common/constants"
import { CreateShippingOptionSchema } from "./schema"
import { useDocumentDirection } from "../../../../../hooks/use-document-direction"
import type { ExtendedAdminFulfillmentProviderOption } from "@custom-types/fulfillment-providers/common"

type CreateShippingOptionDetailsFormProps = {
  form: UseFormReturn<CreateShippingOptionSchema>
  isReturn?: boolean
  zone: HttpTypes.AdminServiceZone
  locationId: string
  fulfillmentProviderOptions: ExtendedAdminFulfillmentProviderOption[]
  selectedProviderId?: string
  type: FulfillmentSetType
}

export const CreateShippingOptionDetailsForm = ({
  form,
  isReturn = false,
  zone,
  locationId,
  fulfillmentProviderOptions,
  selectedProviderId,
  type,
}: CreateShippingOptionDetailsFormProps) => {
  const { t } = useTranslation()
  const direction = useDocumentDirection()
  const isPickup = type === FulfillmentSetType.Pickup

  const shippingProfiles = useComboboxData({
    queryFn: (params) => sdk.admin.shippingProfile.list(params),
    queryKey: ["shipping_profiles"],
    getOptions: (data) =>
      data.shipping_profiles.map((profile) => ({
        label: profile.name,
        value: profile.id,
      })),
  })

  const shippingOptionTypes = useComboboxData({
    queryFn: (params) => sdk.admin.shippingOptionType.list(params),
    queryKey: ["shipping_option_types"],
    getOptions: (data) =>
      data.shipping_option_types.map((type) => ({
        label: type.label,
        value: type.id,
      })),
  })

  const fulfillmentProviders = useComboboxData({
    queryFn: (params) =>
      sdk.admin.fulfillmentProvider.list({
        ...params,
        stock_location_id: locationId,
      }),
    queryKey: ["fulfillment_providers"],
    getOptions: (data) =>
      data.fulfillment_providers.map((provider) => ({
        label: formatProvider(provider.id),
        value: provider.id,
      })),
  })

  return (
    <div className="flex flex-1 flex-col items-center overflow-y-auto" data-testid="location-shipping-option-create-details-form">
      <div className="flex w-full max-w-[720px] flex-col gap-y-8 px-6 py-16">
        <div data-testid="location-shipping-option-create-details-form-header-section">
          <Heading data-testid="location-shipping-option-create-details-form-heading">
            {t(
              `stockLocations.shippingOptions.create.${
                isPickup ? "pickup" : isReturn ? "returns" : "shipping"
              }.header`,
              {
                zone: zone.name,
              }
            )}
          </Heading>
          <Text size="small" className="text-ui-fg-subtle" data-testid="location-shipping-option-create-details-form-hint">
            {t(
              `stockLocations.shippingOptions.create.${
                isReturn ? "returns" : isPickup ? "pickup" : "shipping"
              }.hint`
            )}
          </Text>
        </div>

        {!isPickup && (
          <Form.Field
            control={form.control}
            name="price_type"
            render={({ field }) => {
              return (
                <Form.Item data-testid="location-shipping-option-create-details-form-price-type-item">
                  <Form.Label data-testid="location-shipping-option-create-details-form-price-type-label">
                    {t("stockLocations.shippingOptions.fields.priceType.label")}
                  </Form.Label>
                  <Form.Control data-testid="location-shipping-option-create-details-form-price-type-control">
                    <RadioGroup
                      dir={direction}
                      className="grid grid-cols-1 gap-4 md:grid-cols-2"
                      {...field}
                      onValueChange={field.onChange}
                      data-testid="location-shipping-option-create-details-form-price-type-radio-group"
                    >
                      <RadioGroup.ChoiceBox
                        className="flex-1"
                        value={ShippingOptionPriceType.FlatRate}
                        label={t(
                          "stockLocations.shippingOptions.fields.priceType.options.fixed.label"
                        )}
                        description={t(
                          "stockLocations.shippingOptions.fields.priceType.options.fixed.hint"
                        )}
                        data-testid="location-shipping-option-create-details-form-price-type-flat-rate"
                      />
                      <RadioGroup.ChoiceBox
                        className="flex-1"
                        value={ShippingOptionPriceType.Calculated}
                        label={t(
                          "stockLocations.shippingOptions.fields.priceType.options.calculated.label"
                        )}
                        description={t(
                          "stockLocations.shippingOptions.fields.priceType.options.calculated.hint"
                        )}
                        data-testid="location-shipping-option-create-details-form-price-type-calculated"
                      />
                    </RadioGroup>
                  </Form.Control>
                  <Form.ErrorMessage data-testid="location-shipping-option-create-details-form-price-type-error" />
                </Form.Item>
              )
            }}
          />
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Form.Field
            control={form.control}
            name="name"
            render={({ field }) => {
              return (
                <Form.Item data-testid="location-shipping-option-create-details-form-name-item">
                  <Form.Label data-testid="location-shipping-option-create-details-form-name-label">{t("fields.name")}</Form.Label>
                  <Form.Control data-testid="location-shipping-option-create-details-form-name-control">
                    <Input {...field} data-testid="location-shipping-option-create-details-form-name-input" />
                  </Form.Control>
                  <Form.ErrorMessage data-testid="location-shipping-option-create-details-form-name-error" />
                </Form.Item>
              )
            }}
          />
          <Form.Field
            control={form.control}
            name="shipping_profile_id"
            render={({ field }) => {
              return (
                <Form.Item data-testid="location-shipping-option-create-details-form-shipping-profile-item">
                  <Form.Label data-testid="location-shipping-option-create-details-form-shipping-profile-label">
                    {t("stockLocations.shippingOptions.fields.profile")}
                  </Form.Label>
                  <Form.Control data-testid="location-shipping-option-create-details-form-shipping-profile-control">
                    <Combobox
                      {...field}
                      options={shippingProfiles.options}
                      searchValue={shippingProfiles.searchValue}
                      onSearchValueChange={shippingProfiles.onSearchValueChange}
                      disabled={shippingProfiles.disabled}
                      data-testid="location-shipping-option-create-details-form-shipping-profile-combobox"
                    />
                  </Form.Control>
                  <Form.ErrorMessage data-testid="location-shipping-option-create-details-form-shipping-profile-error" />
                </Form.Item>
              )
            }}
          />
          <Form.Field
            control={form.control}
            name="shipping_option_type_id"
            render={({ field }) => {
              return (
                <Form.Item data-testid="location-shipping-option-create-details-form-shipping-option-type-item">
                  <Form.Label data-testid="location-shipping-option-create-details-form-shipping-option-type-label">
                    {t("stockLocations.shippingOptions.fields.type")}
                  </Form.Label>
                  <Form.Control data-testid="location-shipping-option-create-details-form-shipping-option-type-control">
                    <Combobox
                      {...field}
                      options={shippingOptionTypes.options}
                      searchValue={shippingOptionTypes.searchValue}
                      onSearchValueChange={
                        shippingOptionTypes.onSearchValueChange
                      }
                      disabled={shippingOptionTypes.disabled}
                      data-testid="location-shipping-option-create-details-form-shipping-option-type-combobox"
                    />
                  </Form.Control>
                  <Form.ErrorMessage data-testid="location-shipping-option-create-details-form-shipping-option-type-error" />
                </Form.Item>
              )
            }}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Form.Field
            control={form.control}
            name="provider_id"
            render={({ field }) => {
              return (
                <Form.Item data-testid="location-shipping-option-create-details-form-provider-item">
                  <Form.Label
                    tooltip={t(
                      "stockLocations.fulfillmentProviders.shippingOptionsTooltip"
                    )}
                    data-testid="location-shipping-option-create-details-form-provider-label"
                  >
                    {t("stockLocations.shippingOptions.fields.provider")}
                  </Form.Label>
                  <Form.Control data-testid="location-shipping-option-create-details-form-provider-control">
                    <Combobox
                      {...field}
                      onChange={(e) => {
                        field.onChange(e)
                        form.setValue("fulfillment_option_id", "")
                      }}
                      options={fulfillmentProviders.options}
                      searchValue={fulfillmentProviders.searchValue}
                      onSearchValueChange={
                        fulfillmentProviders.onSearchValueChange
                      }
                      disabled={fulfillmentProviders.disabled}
                      data-testid="location-shipping-option-create-details-form-provider-combobox"
                    />
                  </Form.Control>
                  <Form.ErrorMessage data-testid="location-shipping-option-create-details-form-provider-error" />
                </Form.Item>
              )
            }}
          />

          <Form.Field
            control={form.control}
            name="fulfillment_option_id"
            render={({ field }) => {
              return (
                <Form.Item data-testid="location-shipping-option-create-details-form-fulfillment-option-item">
                  <Form.Label data-testid="location-shipping-option-create-details-form-fulfillment-option-label">
                    {t(
                      "stockLocations.shippingOptions.fields.fulfillmentOption"
                    )}
                  </Form.Label>
                  <Form.Control data-testid="location-shipping-option-create-details-form-fulfillment-option-control">
                    <Select
                      dir={direction}
                      {...field}
                      onValueChange={field.onChange}
                      disabled={!selectedProviderId}
                      key={selectedProviderId}
                      data-testid="location-shipping-option-create-details-form-fulfillment-option-select"
                    >
                      <Select.Trigger ref={field.ref} data-testid="location-shipping-option-create-details-form-fulfillment-option-trigger">
                        <Select.Value />
                      </Select.Trigger>

                      <Select.Content data-testid="location-shipping-option-create-details-form-fulfillment-option-content">
                        {fulfillmentProviderOptions
                          ?.filter((fo) => !!fo.is_return === isReturn)
                          .map((option) => (
                            <Select.Item value={option.id} key={option.id} data-testid={`location-shipping-option-create-details-form-fulfillment-option-option-${option.id}`}>
                              {option.name || option.id}
                            </Select.Item>
                          ))}
                      </Select.Content>
                    </Select>
                  </Form.Control>
                  <Form.ErrorMessage data-testid="location-shipping-option-create-details-form-fulfillment-option-error" />
                </Form.Item>
              )
            }}
          />
        </div>

        <Divider />
        <SwitchBox
          control={form.control}
          name="enabled_in_store"
          label={t("stockLocations.shippingOptions.fields.enableInStore.label")}
          description={t(
            "stockLocations.shippingOptions.fields.enableInStore.hint"
          )}
          data-testid="location-shipping-option-create-details-form-enabled-in-store"
        />
      </div>
    </div>
  )
}
