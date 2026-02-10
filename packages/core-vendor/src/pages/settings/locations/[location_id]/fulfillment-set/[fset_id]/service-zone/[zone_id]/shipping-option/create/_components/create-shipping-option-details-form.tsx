import { Heading, Input, RadioGroup, Text } from "@medusajs/ui"
import { UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { VendorExtendedAdminServiceZone } from "@custom-types/stock-location"

import { Form } from "@components/common/form"
import { Combobox } from "@components/inputs/combobox"
import { useComboboxData } from "@hooks/use-combobox-data"
import { fetchQuery } from "@lib/client"
import {
  FulfillmentSetType,
  ShippingOptionPriceType,
} from "@pages/settings/locations/_common/constants"
import { CreateShippingOptionSchema } from "./schema"

type CreateShippingOptionDetailsFormProps = {
  form: UseFormReturn<CreateShippingOptionSchema>
  isReturn?: boolean
  zone: VendorExtendedAdminServiceZone
  type: FulfillmentSetType
}

export const CreateShippingOptionDetailsForm = ({
  form,
  isReturn = false,
  zone,
  type
}: CreateShippingOptionDetailsFormProps) => {
  const { t } = useTranslation()

  const isPickup = type === FulfillmentSetType.Pickup

  const shippingProfiles = useComboboxData({
    queryFn: () =>
      fetchQuery(`/vendor/shipping-profiles`, {
        method: "GET",
      }),
    queryKey: ["shipping_profiles_create_shipping_option"],
    getOptions: (data) =>
      (data.shipping_profiles || []).map((profile: any) => ({
        label: profile.shipping_profile.name.includes(":")
          ? profile.shipping_profile.name.split(":")[1]
          : profile.shipping_profile.name,
        value: profile.shipping_profile.id,
      })),
  })

  // const fulfillmentProviders = useComboboxData({
  //   queryFn: (params) =>
  //     sdk.admin.fulfillmentProvider.list({
  //       ...params,
  //       stock_location_id: locationId,
  //     }),
  //   queryKey: ['fulfillment_providers'],
  //   getOptions: (data) =>
  //     data.fulfillment_providers.map((provider) => ({
  //       label: formatProvider(provider.id),
  //       value: provider.id,
  //     })),
  // });

  return (
    <div className="flex flex-1 flex-col items-center overflow-y-auto">
      <div className="flex w-full max-w-[720px] flex-col gap-y-8 px-6 py-16">
        <div>
          <Heading>
            {t(
              `stockLocations.shippingOptions.create.${
                isPickup ? "pickup" : isReturn ? "returns" : "shipping"
              }.header`,
              {
                zone: zone.name,
              }
            )}
          </Heading>
          <Text size="small" className="text-ui-fg-subtle">
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
                <Form.Item>
                  <Form.Label>
                    {t("stockLocations.shippingOptions.fields.priceType.label")}
                  </Form.Label>
                  <Form.Control>
                    <RadioGroup
                      className="grid grid-cols-1 gap-4 md:grid-cols-2"
                      {...field}
                      onValueChange={field.onChange}
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
                      />
                    </RadioGroup>
                  </Form.Control>
                  <Form.ErrorMessage />
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
                <Form.Item>
                  <Form.Label>{t("fields.name")}</Form.Label>
                  <Form.Control>
                    <Input {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )
            }}
          />
          <Form.Field
            control={form.control}
            name="shipping_profile_id"
            render={({ field }) => {
              return (
                <Form.Item>
                  <Form.Label>
                    {t("stockLocations.shippingOptions.fields.profile")}
                  </Form.Label>
                  <Form.Control>
                    <Combobox
                      {...field}
                      options={shippingProfiles.options}
                      searchValue={shippingProfiles.searchValue}
                      onSearchValueChange={shippingProfiles.onSearchValueChange}
                      disabled={shippingProfiles.disabled}
                    />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )
            }}
          />
        </div>

        {/* <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
          <Form.Field
            control={form.control}
            name='provider_id'
            render={({ field }) => {
              return (
                <Form.Item>
                  <Form.Label
                    tooltip={t(
                      'stockLocations.fulfillmentProviders.shippingOptionsTooltip'
                    )}
                  >
                    {t(
                      'stockLocations.shippingOptions.fields.provider'
                    )}
                  </Form.Label>
                  <Form.Control>
                    <Combobox
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        form.setValue(
                          'fulfillment_option_id',
                          ''
                        );
                      }}
                      options={fulfillmentProviders.options}
                      searchValue={
                        fulfillmentProviders.searchValue
                      }
                      onSearchValueChange={
                        fulfillmentProviders.onSearchValueChange
                      }
                      disabled={
                        fulfillmentProviders.disabled
                      }
                    />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              );
            }}
          />

          <Form.Field
            control={form.control}
            name='fulfillment_option_id'
            render={({ field }) => {
              return (
                <Form.Item>
                  <Form.Label>
                    {t(
                      'stockLocations.shippingOptions.fields.fulfillmentOption'
                    )}
                  </Form.Label>
                  <Form.Control>
                    <Select
                      {...field}
                      onValueChange={field.onChange}
                      disabled={!selectedProviderId}
                      key={selectedProviderId}
                    >
                      <Select.Trigger ref={field.ref}>
                        <Select.Value />
                      </Select.Trigger>

                      <Select.Content>
                        {fulfillmentProviderOptions
                          ?.filter(
                            (fo) =>
                              !!fo.is_return === isReturn
                          )
                          .map((option) => (
                            <Select.Item
                              value={option.id}
                              key={option.id}
                            >
                              {option.name || option.id}
                            </Select.Item>
                          ))}
                      </Select.Content>
                    </Select>
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              );
            }}
          />
        </div> */}

        {/* <Divider />
        <SwitchBox
          control={form.control}
          name="enabled_in_store"
          label={t("stockLocations.shippingOptions.fields.enableInStore.label")}
          description={t(
            "stockLocations.shippingOptions.fields.enableInStore.hint"
          )}
        /> */}
      </div>
    </div>
  )
}
